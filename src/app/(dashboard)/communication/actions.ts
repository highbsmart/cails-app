"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function sendMessage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const recipientType = String(formData.get("recipient_type") ?? "");
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();
  const isUrgent = formData.get("is_urgent") === "on";

  const payload: Record<string, unknown> = {
    sender_id: user!.id,
    subject,
    body,
    is_urgent: isUrgent,
  };

  if (recipientType === "office") {
    payload.recipient_office_id = String(formData.get("recipient_office_id") ?? "");
  } else {
    const email = String(formData.get("recipient_email") ?? "").trim();
    const { data: match } = await supabase.rpc("find_user_by_email", { p_email: email });
    if (!match || match.length === 0) {
      redirect(
        "/communication/new?error=" +
          encodeURIComponent(`No CAILS account found for ${email}. Check the email and try again.`)
      );
    }
    payload.recipient_id = match![0].id;
  }

  if (!body) {
    redirect("/communication/new?error=" + encodeURIComponent("Message body is required."));
  }

  const { error } = await supabase.from("messages").insert(payload);

  if (error) {
    redirect("/communication/new?error=" + encodeURIComponent(error.message));
  }

  redirect("/communication");
}

export async function replyToMessage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rootId = String(formData.get("root_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  const { data: original } = await supabase
    .from("messages")
    .select("sender_id, recipient_id, recipient_office_id, subject")
    .eq("id", rootId)
    .single();

  if (!body || !original) {
    redirect(`/communication/${rootId}?error=` + encodeURIComponent("Reply cannot be empty."));
  }

  // Reply routes to "the other side" of the original message: if I sent the
  // original, reply goes to whoever/whatever I originally addressed (person
  // or office); if I'm on the receiving side, reply goes back to the sender.
  const iWasSender = original!.sender_id === user!.id;
  const payload = iWasSender
    ? {
        recipient_id: original!.recipient_id,
        recipient_office_id: original!.recipient_office_id,
      }
    : { recipient_id: original!.sender_id, recipient_office_id: null };

  const { error } = await supabase.from("messages").insert({
    sender_id: user!.id,
    ...payload,
    parent_message_id: rootId,
    subject: original!.subject,
    body,
  });

  if (error) {
    redirect(`/communication/${rootId}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath(`/communication/${rootId}`);
  redirect(`/communication/${rootId}`);
}

export async function markRead(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/communication");
}

export async function updateMessageStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const { error } = await supabase.from("messages").update({ status }).eq("id", id);
  if (error) {
    redirect(`/communication/${id}?error=` + encodeURIComponent(error.message));
  }
  revalidatePath(`/communication/${id}`);
  revalidatePath("/communication");
  redirect(`/communication/${id}`);
}

export async function archiveMessage(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: msg } = await supabase
    .from("messages")
    .select("sender_id, recipient_id")
    .eq("id", id)
    .single();

  if (msg?.sender_id === user?.id) {
    await supabase.from("messages").update({ archived_by_sender: true }).eq("id", id);
  } else {
    await supabase.from("messages").update({ archived_by_recipient: true }).eq("id", id);
  }

  revalidatePath("/communication");
  redirect("/communication");
}

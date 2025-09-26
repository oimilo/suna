'use server';

import { createClient } from '../supabase/server';

export async function editPersonalAccountName(
  prevState: any,
  formData: FormData,
) {
  const name = formData.get('name') as string;
  const accountId = formData.get('accountId') as string;
  const supabase = await createClient();

  const { error } = await supabase.rpc('update_account', {
    name,
    account_id: accountId,
  });

  if (error) {
    return {
      message: error.message,
    };
  }

  // Update authenticated user's metadata with the same name
  const { error: authErr } = await supabase.auth.updateUser({
    data: { name },
  });

  if (authErr) {
    return {
      message: authErr.message,
    };
  }
}

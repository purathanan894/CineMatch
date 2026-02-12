import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/profile';

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) setError(error.message);
    else setProfile(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return { profile, loading, error, refresh: fetchProfile };
}

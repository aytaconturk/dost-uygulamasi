import { supabase } from './supabase';
import type { UserRole, Teacher, Student, User } from './supabase-types';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  teacher?: Teacher;
  student?: Student;
};

export async function signUp(
  email: string,
  password: string,
  role: UserRole,
  firstName: string,
  lastName: string,
  additionalData?: {
    schoolName?: string;
    teacherId?: string;
  }
) {
  try {
    if (role === 'teacher') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'teacher',
            first_name: firstName,
            last_name: lastName,
            school_name: additionalData?.schoolName || '',
          },
        },
      });

      if (error || !data.user) {
        return { data, error };
      }

      // Create user record in users table
      const { error: userError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        role: 'teacher',
      });

      if (userError) {
        return { data: null, error: userError };
      }

      // Create teacher record
      const { error: teacherError } = await supabase.from('teachers').insert({
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        school_name: additionalData?.schoolName || null,
      });

      if (teacherError) {
        return { data: null, error: teacherError };
      }

      // Try to auto-confirm email
      await supabase.auth.admin.updateUserById(data.user.id, {
        email_confirmed_at: new Date().toISOString(),
      }).catch(() => {
        console.log('Auto-confirm not available, email verification may be required');
      });

      return { data, error: null };
    } else if (role === 'user') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'user',
            first_name: firstName,
            last_name: lastName,
            teacher_id: additionalData?.teacherId || '',
          },
        },
      });

      if (error || !data.user) {
        return { data, error };
      }

      // Create user record in users table
      const { error: userError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        role: 'user',
      });

      if (userError) {
        return { data: null, error: userError };
      }

      // Create student record
      const { error: studentError } = await supabase.from('students').insert({
        user_id: data.user.id,
        teacher_id: additionalData?.teacherId || '',
        first_name: firstName,
        last_name: lastName,
      });

      if (studentError) {
        return { data: null, error: studentError };
      }

      // Try to auto-confirm email
      await supabase.auth.admin.updateUserById(data.user.id, {
        email_confirmed_at: new Date().toISOString(),
      }).catch(() => {
        console.log('Auto-confirm not available, email verification may be required');
      });

      return { data, error: null };
    }

    return { error: new Error('Invalid role'), data: null };
  } catch (error) {
    return { error, data: null };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error, data: null };
    }

    if (!data.user) {
      return { error: new Error('No user returned'), data: null };
    }

    // Get user role and additional data
    let { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // If user record doesn't exist, create it (for users who signed up before the fix)
    if (!userData) {
      const userMetadata = data.user.user_metadata || {};
      const role = (userMetadata.role || 'user') as UserRole;

      const { error: createUserError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email || email,
        role,
      });

      if (createUserError) {
        return { error: new Error(`Failed to create user record: ${createUserError.message}`), data: null };
      }

      // Fetch the newly created user record
      const { data: newUserData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      userData = newUserData;
    }

    if (!userData) {
      return { error: new Error('User record not found'), data: null };
    }

    // Get role-specific data
    let roleData: Teacher | Student | null = null;

    if (userData.role === 'admin') {
      // Admin users need a teacher record for login to work
      // Try to load teacher data if it exists
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (teacherData) {
        roleData = teacherData;
      } else {
        // Create teacher record for admin if missing
        const userMetadata = data.user.user_metadata || {};
        const { data: newTeacher } = await supabase.from('teachers').insert({
          user_id: data.user.id,
          first_name: userMetadata.first_name || 'Admin',
          last_name: userMetadata.last_name || 'DOST',
          school_name: userMetadata.school_name || 'Sistem Yöneticisi',
        }).select().single();

        roleData = newTeacher;
      }
    } else if (userData.role === 'teacher') {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      roleData = teacherData;

      // Create teacher record if missing
      if (!teacherData) {
        const userMetadata = data.user.user_metadata || {};
        const { data: newTeacher } = await supabase.from('teachers').insert({
          user_id: data.user.id,
          first_name: userMetadata.first_name || null,
          last_name: userMetadata.last_name || null,
          school_name: userMetadata.school_name || null,
        }).select().single();

        roleData = newTeacher;
      }
    } else if (userData.role === 'user') {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      roleData = studentData;

      // Create student record if missing
      if (!studentData) {
        const userMetadata = data.user.user_metadata || {};
        const { data: newStudent } = await supabase.from('students').insert({
          user_id: data.user.id,
          teacher_id: userMetadata.teacher_id || '',
          first_name: userMetadata.first_name || '',
          last_name: userMetadata.last_name || '',
        }).select().single();

        roleData = newStudent;
      }
    }

    const authUser: AuthUser = {
      id: data.user.id,
      email: userData.email,
      role: userData.role as UserRole,
    };

    if ((userData.role === 'admin' || userData.role === 'teacher') && roleData) {
      authUser.teacher = roleData as Teacher;
    } else if (userData.role === 'user' && roleData) {
      authUser.student = roleData as Student;
    }

    return { error: null, data: authUser };
  } catch (error) {
    return { error, data: null };
  }
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return null;
  }

  let roleData: Teacher | Student | null = null;

  if (userData.role === 'admin') {
    // Admin users need a teacher record for login to work
    // Try to load teacher data if it exists
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (teacherData) {
      roleData = teacherData;
    } else {
      // Create teacher record for admin if missing
      const { data: newTeacher } = await supabase.from('teachers').insert({
        user_id: user.id,
        first_name: 'Admin',
        last_name: 'DOST',
        school_name: 'Sistem Yöneticisi',
      }).select().single();

      roleData = newTeacher;
    }
  } else if (userData.role === 'teacher') {
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', user.id)
      .single();
    roleData = teacherData;
  } else if (userData.role === 'user') {
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();
    roleData = studentData;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: userData.email,
    role: userData.role as UserRole,
  };

  if ((userData.role === 'admin' || userData.role === 'teacher') && roleData) {
    authUser.teacher = roleData as Teacher;
  } else if (userData.role === 'user' && roleData) {
    authUser.student = roleData as Student;
  }

  return authUser;
}

export async function onAuthStateChange(
  callback: (user: AuthUser | null) => void
) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

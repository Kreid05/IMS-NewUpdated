export async function fetchCurrentUser() {
  try {
    const response = await fetch('http://127.0.0.1:4000/auth/users/me', {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Error: " + response.status);
    }

    const userData = await response.json();
    console.log('Current user data:', userData);
    return userData;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
} 

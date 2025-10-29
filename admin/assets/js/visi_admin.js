// (function quickAdminGuard() {
//   try {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       // immediate redirect — prevents UI flicker
//       location.replace(window.location.origin + '/admin/sign-in.html');
//       return;
//     }

    
//   } catch (e) { /* ignore */ }
// })();


(function quickAdminGuard() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      location.replace(window.location.origin + '/admin/sign-in.html');
      return;
    }
  } catch (e) {
    console.error('Admin guard error:', e);
  }
})();

// 👇 define globally accessible function
window._bifs_fetchUsers = async function () {
  try {
    const res = await fetch('https://bifs-backend.onrender.com/api/users', {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token'),
      },
    });
    const data = await res.json();
    console.log('Fetched users:', data);
    return data;
  } catch (err) {
    console.error('Error fetching users:', err);
  }
};

// delete_user.js
// Depends on: supabaseClient already defined in dashboard.html

function confirmDeleteUser() {
    document.getElementById('delete-user-popup').style.display = 'flex';
}

function closeDeleteUserPopup() {
    document.getElementById('delete-user-popup').style.display = 'none';
}

async function deleteUser() {

    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
        closeDeleteUserPopup();
        alert('Something went wrong. Please try again.');
        return;
    }

    let response;
    try {
        response = await fetch(
            'https://zvhdyptgwkdugldwuuqv.supabase.co/functions/v1/delete-user',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (err) {
        console.error('Edge Function call failed:', err);
        closeDeleteUserPopup();
        alert('Something went wrong. Please try again.');
        return;
    }

    if (!response.ok) {
        console.error('Edge Function error:', await response.text());
        closeDeleteUserPopup();
        alert('Something went wrong. Please try again.');
        return;
    }

    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

document.getElementById('delete-user-popup').addEventListener('click', function (e) {
    if (e.target === this) closeDeleteUserPopup();
});
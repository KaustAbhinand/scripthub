// delete_idea.js
// Depends on: supabaseClient and getIdeaId() already defined in idea.html

function confirmDeleteIdea() {
    document.getElementById('delete-popup').style.display = 'flex';
}

function closePopup() {
    document.getElementById('delete-popup').style.display = 'none';
}

async function deleteIdea() {
    const ideaId = getIdeaId();

    const { error } = await supabaseClient
        .from('ideas')
        .delete()
        .eq('id', ideaId);

    if (error) {
        console.error('Delete error:', error);
        closePopup();
        alert('Something went wrong. Please try again.');
        return;
    }

    // Drafts are cleaned up automatically via ON DELETE CASCADE
    window.location.href = '../user-management/dashboard.html';
}

// Close popup if user clicks outside the box
document.getElementById('delete-popup').addEventListener('click', function (e) {
    if (e.target === this) closePopup();
});
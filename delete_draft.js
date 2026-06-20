// delete_draft.js
// Depends on: supabaseClient and getDraftId() already defined in draft_viewer.js,
// which must be loaded BEFORE this script in draft_viewer.html.

function confirmDeleteDraft() {
    document.getElementById('delete-draft-popup').style.display = 'flex';
}

function closeDeleteDraftPopup() {
    document.getElementById('delete-draft-popup').style.display = 'none';
}

async function deleteDraft() {
    const versionId = getversionId();

    // Fetch idea_id + storage_path first, so we know where to redirect
    // and which file to remove from Storage.
    const { data: version, error: fetchError } = await supabaseClient
        .from('versions')
        .select('draft_id, storage_path')
        .eq('id', versionId)
        .single();

    if (fetchError || !version) {
        closeDeleteDraftPopup();
        alert('Something went wrong. Please try again.');
        return;
    }

    // Remove the file from the storage bucket
    const { error: storageError } = await supabaseClient
        .storage
        .from('drafts')
        .remove([version.storage_path]);

    if (storageError) {
        // Log but don't block the row delete on a storage hiccup
        console.error('Storage delete error:', storageError);
    }

    // Remove the row from the versions table
    const { error: deleteError } = await supabaseClient
        .from('versions')
        .delete()
        .eq('id', versionId);

    if (deleteError) {
        console.error('Delete error:', deleteError);
        closeDeleteDraftPopup();
        alert('Something went wrong. Please try again.');
        return;
    }

    window.location.href = `idea.html?id=${version.idea_id}`;
}

// Close popup if user clicks outside the box
document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('delete-draft-popup');
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) closeDeleteDraftPopup();
        });
    }
});
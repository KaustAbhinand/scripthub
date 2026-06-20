
// All logic for draft_submission.html

const SUPABASE_URL      = 'https://zvhdyptgwkdugldwuuqv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aGR5cHRnd2tkdWdsZHd1dXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDQwNDMsImV4cCI6MjA5NjgyMDA0M30.MMitZCEYLlX0cMEpDVgyjBG4CFXAOAgbN47s3gRONvU';
const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let ideaId      = null;
let draftId     = null;
let chosenFile  = null;

function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
}

function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/* ── Auth + init ── */
async function init() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = session.user;

    ideaId = getParam('ideaId');
    draftId = getParam('draftId');
    if (!ideaId || !draftId) {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('back-link').onclick =
        () => window.location.href = `idea.html?id=${ideaId}`;
}

/* ── File input ── */
function onFileChosen() {
    const input = document.getElementById('file-input');
    chosenFile  = input.files[0] || null;
    document.getElementById('file-chosen').textContent =
        chosenFile ? `Selected: ${chosenFile.name}` : '';

    if (chosenFile) {
        document.getElementById('draft-content').value = '';
    }
}

function onWriteInput() { // incase user chooses to write in the text box.
    if (document.getElementById('draft-content').value.trim()) {
        chosenFile = null;
        document.getElementById('file-input').value       = '';
        document.getElementById('file-chosen').textContent = '';
    }
}

/* ── Validation helpers ── */
function clearError(fieldId, errorId) {
    document.getElementById(fieldId).classList.remove('invalid');
    document.getElementById(errorId).style.display = 'none';
}

function showFieldError(fieldId, errorId) {
    document.getElementById(fieldId).classList.add('invalid');
    document.getElementById(errorId).style.display = 'block';
}

/* ── Submit ── */
async function handleSubmit() {
    document.getElementById('submit-error').style.display = 'none';

    const commitMessage = document.getElementById('commit-message').value.trim();
    const writtenText   = document.getElementById('draft-content').value.trim();

    // Validate required fields
    let valid = true;
    if (!commitMessage) { showFieldError('commit-message', 'commit-error'); valid = false; }
    if (!valid) return;

    // Validate content
    if (!chosenFile && !writtenText) {
        const errEl = document.getElementById('submit-error');
        errEl.textContent   = 'Please upload a file or write your draft.';
        errEl.style.display = 'block';
        return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled    = true;
    btn.textContent = 'Submitting...';

    try {
        let storagePath = null;
        let fileType    = null;
        let wordCount   = null;

        if (chosenFile) {
            const ext  = chosenFile.name.split('.').pop().toLowerCase();
            storagePath = `${currentUser.id}/${ideaId}/${Date.now()}_${chosenFile.name}`;
            fileType    = ext;

            const { error: uploadError } = await supabaseClient
                .storage
                .from('drafts')
                .upload(storagePath, chosenFile);

            if (uploadError) throw uploadError;

        } else {
            const blob  = new Blob([writtenText], { type: 'text/plain' });
            storagePath = `${currentUser.id}/${ideaId}/${Date.now()}_draft.txt`;
            fileType    = 'txt';
            wordCount   = countWords(writtenText);

            const { error: uploadError } = await supabaseClient
                .storage
                .from('drafts')
                .upload(storagePath, blob);

            if (uploadError) throw uploadError;
        }
        
        const { data: latestVersion } =
        await supabaseClient
        .from('versions')
        .select('id, version')
        .eq('draft_id', draftId)
        .order('version', {
            ascending: false
        })
        .limit(1);

        const nextVersion =
        latestVersion &&
        latestVersion.length > 0
        ? latestVersion[0].version + 1
        : 1;

        const parentId =
        latestVersion &&
        latestVersion.length > 0
        ? latestVersion[0].id
        : null;

        const { error: insertError } =
        await supabaseClient
        .from('versions')
        .insert({

            draft_id: draftId,

            parent_id: parentId,

            version: nextVersion,

            storage_path: storagePath,

            file_type: fileType,

            commit_message: commitMessage,

            word_count: wordCount
        });

        if (insertError) throw insertError;
        window.location.href = `idea.html?id=${ideaId}`;

    } catch (err) {
        console.error(err);
        const errEl = document.getElementById('submit-error');
        errEl.textContent   = 'Something went wrong. Please try again.';
        errEl.style.display = 'block';
        btn.disabled    = false;
        btn.textContent = 'Upload file';
    }
}

init();
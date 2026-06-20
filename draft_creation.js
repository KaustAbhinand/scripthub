const SUPABASE_URL = 'https://zvhdyptgwkdugldwuuqv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aGR5cHRnd2tkdWdsZHd1dXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDQwNDMsImV4cCI6MjA5NjgyMDA0M30.MMitZCEYLlX0cMEpDVgyjBG4CFXAOAgbN47s3gRONvU';

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

let currentUser = null;

async function init() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;

    document
        .querySelector('.create-btn')
        .addEventListener('click', handleCreateDraft);
}

async function handleCreateDraft() {

    const params = new URLSearchParams(
        window.location.search
    );

    const ideaId = params.get('ideaId');

    const title = document
        .getElementById('draft-title')
        .value
        .trim();

    const description = document
        .getElementById('draft-description')
        .value
        .trim();

    const titleError =
        document.querySelector('.field-error');

    const submitError =
        document.querySelector('.submit-error');

    titleError.style.display = 'none';
    submitError.style.display = 'none';

    if (!title) {
        titleError.style.display = 'block';
        return;
    }

    const button =
        document.querySelector('.create-btn');

    button.disabled = true;
    button.textContent = 'Creating...';

    const { error } = await supabaseClient
        .from('drafts')
        .insert({
            idea_id: ideaId,
            title: title,
            description: description || null
        });

    if (error) {
        console.error(error);

        submitError.textContent =
            'Failed to create draft. Please try again.';
        submitError.style.display = 'block';

        button.disabled = false;
        button.textContent = 'Create Draft';

        return;
    }

    window.location.href =
        `idea.html?id=${ideaId}`;
}

init();
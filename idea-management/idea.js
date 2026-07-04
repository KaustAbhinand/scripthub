const SUPABASE_URL = 'https://zvhdyptgwkdugldwuuqv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aGR5cHRnd2tkdWdsZHd1dXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDQwNDMsImV4cCI6MjA5NjgyMDA0M30.MMitZCEYLlX0cMEpDVgyjBG4CFXAOAgbN47s3gRONvU';
// creating the supabase client 
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getIdeaId() { // get the idea id from the URL query parameters
    return new URLSearchParams(window.location.search).get('id');
}

function formatDate(iso) { // format the upload date
    const d = new Date(iso);

    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function confirmDeleteDraft(draftId) { // confirm draft deletion
    const confirmed =
        confirm(
            "Delete this draft and all its versions?"
        );

    if (!confirmed) return;

    deleteDraft(draftId);
}

async function deleteDraft(draftId) { // draft deletion logic
    const { error } =
        await supabaseClient
            .from('drafts')
            .delete()
            .eq('id', draftId);

    if (error) {
        console.error("Delete error: ", error);
        alert(
            error.message || "Failed to delete draft."
        );
        return;
    }

    await loadDrafts(getIdeaId());
}

async function init() { // Initialisation of the page

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = '../user-management/index.html';
        return;
    }

    const ideaId = getIdeaId();

    if (!ideaId) {
        window.location.href = '../user-management/dashboard.html';
        return;
    }

    await loadIdea(ideaId);
    await loadDrafts(ideaId);
}

async function loadIdea(ideaId) { // Load the idea

    const { data: idea, error } =
        await supabaseClient
            .from('ideas')
            .select('*')
            .eq('id', ideaId)
            .single();

    if (error || !idea) {
        window.location.href = '../user-management/dashboard.html';
        return;
    }

    document.title = `${idea.name} - ScriptHub`;

    document.getElementById('idea-name').textContent =
        idea.name;

    const descEl =
        document.getElementById('idea-description');

    descEl.textContent =
        idea.description || '';

    if (!idea.description) {
        descEl.style.display = 'none';
    }

    const genreEl =
        document.getElementById('idea-genre');

    if (idea.genre) {
        genreEl.textContent = idea.genre;
        genreEl.style.display = 'inline-block';
    }
}

async function loadDrafts(ideaId) { // Load the drafts of an idea, from the drafts table

    const { data: drafts, error } =
        await supabaseClient
            .from('drafts')
            .select('*')
            .eq('idea_id', ideaId)
            .order('created_at', {
                ascending: true
            });

    const listEl =
        document.getElementById('draft-list');

    if (error) {
        console.error(error);

        listEl.innerHTML =
            '<tr><td colspan="4" class="no-drafts">Failed to load drafts.</td></tr>';

        return;
    }

    if (!drafts || drafts.length === 0) {

        listEl.innerHTML =
            '<tr><td colspan="4" class="no-drafts">No drafts yet. Create your first draft.</td></tr>';

        return;
    }

    listEl.innerHTML = '';

    drafts.forEach(draft => {

      const wrapper =
            document.createElement('div');

        wrapper.className =
            'draft-wrapper';

        const safeTitle = DOMPurify.sanitize(draft.title);
        const safeDescription = DOMPurify.sanitize(draft.description || '');
        // Sanitizing the title and desc to prevent XSS injection.
        wrapper.innerHTML = `
            <div class="draft-item">

                <span class="draft-name">
                    ${safeTitle}
                </span>

                <span class="draft-description">
                    ${safeDescription}
                </span>

                <span class="draft-date">
                    ${formatDate(draft.created_at)}
                </span>

                <div class="draft-actions">

                <button
                class="upload-version-btn"
                onclick="event.stopPropagation(); uploadVersion('${draft.id}')">
                Upload Version
                </button>

                <button
                class="delete-draft-btn"
                onclick="event.stopPropagation(); confirmDeleteDraft('${draft.id}')">
                Delete Draft
            </button>

            </div>

            </div>

            <div
                class="versions-container"
                id="versions-${draft.id}">
            </div>
        `;

        wrapper.querySelector('.draft-item')
            .addEventListener('click', () => {
                toggleVersions(draft.id);
            });

        listEl.appendChild(wrapper);
    });

        row.addEventListener('click', () => {
            toggleVersions(draft.id);
        });

        // Versions row — hidden by default, spans all columns
        const versionsRow =
            document.createElement('tr');

        versionsRow.className = 'versions-row';

        versionsRow.innerHTML = `
            <td colspan="4">
                <div class="versions-container" id="versions-${draft.id}"></div>
            </td>
        `;

        listEl.appendChild(row);
        listEl.appendChild(versionsRow);
    }

async function toggleVersions(draftId) { // Load the versions of a draft from the versions table

    const container =
        document.getElementById(
            `versions-${draftId}`
        );

    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }

    const { data: versions, error } =
        await supabaseClient
            .from('versions')
            .select('*')
            .eq('draft_id', draftId)
            .order('version', {
                ascending: false
            });

    if (error) {
        console.error(error);
        return;
    }

    container.innerHTML = '';

    if (!versions || versions.length === 0) {

        container.innerHTML = `
            <div class="version-item">
                No versions uploaded.
            </div>
        `;

    } else {

        versions.forEach(version => {

            const link =
                document.createElement('a');

            link.className =
                'version-item';

            link.href =
                `../draft-management/draft_viewer.html?versionId=${version.id}`;

            link.textContent =
                `v${version.version} - ${version.commit_message}`;

            container.appendChild(link);
        });
    }

    container.style.display = 'block';
}

function handleUpload() { // handle the upload version button click

    const ideaId = getIdeaId();

    window.location.href =
        `../draft-management/draft_creation.html?ideaId=${ideaId}`;
}

function uploadVersion(draftId) { // handle the upload version button click

    const ideaId = getIdeaId();

    window.location.href =
        `../draft-management/draft_submission.html?draftId=${draftId}&ideaId=${ideaId}`;
}

init();
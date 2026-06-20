const SUPABASE_URL = "https://zvhdyptgwkdugldwuuqv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aGR5cHRnd2tkdWdsZHd1dXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDQwNDMsImV4cCI6MjA5NjgyMDA0M30.MMitZCEYLlX0cMEpDVgyjBG4CFXAOAgbN47s3gRONvU";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


function getversionId() {
    return new URLSearchParams(
        window.location.search
    ).get("versionId");
}

async function init() {

     const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    const versionId = getversionId();

    if(!versionId) {
        document.getElementById("viewer").innerHTML = "No version specified.";
        return;
    }

    const { data: version, error } =
        await supabaseClient
            .from("versions")
            .select("*")
            .eq("id", versionId)
            .single();

    if (error || !version) {

        document.getElementById("viewer")
            .innerHTML = "Version not found.";

        return;
    }

    const { data: draft } =
    await supabaseClient
        .from("drafts")
        .select("title, idea_id")
        .eq("id", version.draft_id)
        .single();

    document.getElementById("draft-title")
    .textContent =
        `${draft.title} - v${version.version}`;

    document.getElementById("back-btn")
    .onclick = () =>
        window.location.href =
            `idea.html?id=${ideaId}`;


    await displayVersion(version);
}

async function getSignedUrl(storagePath) {
    const { data, error } = await supabaseClient
        .storage
        .from('drafts')
        .createSignedUrl(storagePath, 300); // valid for 5 minutes

    if (error) throw error;
    return data.signedUrl;
}

async function displayVersion(version) {

    const type =
        version.file_type.toLowerCase();

    const viewer =
        document.getElementById("viewer");

    let signedUrl;

    try {
        signedUrl = await getSignedUrl(version.storage_path);
    } catch (err) {
        console.error(err);
        viewer.innerHTML = "Failed to load version.";
        return;
    }

    //----------------------------------
    // TXT
    //----------------------------------

    if (type === "txt") {

        const response =
            await fetch(signedUrl);

        const text =
            await response.text();

        viewer.innerHTML =
            `<pre>${escapeHtml(text)}</pre>`;

        return;
    }

    //----------------------------------
    // PDF
    //----------------------------------

    if (type === "pdf") {

        viewer.innerHTML = `
            <iframe
                src="${signedUrl}"
                width="100%"
                height="900px"
                style="border:none;">
            </iframe>
        `;

        return;
    }

    //----------------------------------
    // DOCX
    //----------------------------------

    if (type === "docx") {

        const response =
            await fetch(signedUrl);

        const arrayBuffer =
            await response.arrayBuffer();

        const result =
            await mammoth.convertToHtml({
                arrayBuffer
            });

        viewer.innerHTML =
            result.value;

        return;
    }

    viewer.innerHTML =
        "Unsupported file type.";
}

function escapeHtml(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

init();[]
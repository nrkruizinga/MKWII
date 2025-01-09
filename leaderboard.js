window.onload = async function loadPage() {
    var trackData = await loadTracks();
    for (var cups of trackData.cups) {
        for (var tracks of cups.tracks) {
            for (var track of tracks.versions) {
                //var leaderboard = await getLeaderboard(track);
            };
        };
    };
}
async function loadTracks() {
    return fetch("http://127.0.0.1:5500/tracks.json").then(res => res.json());
}
function getLeaderboard(track) {
    return fetch("https://tt.chadsoft.co.uk" + track).then(res => res.json());
}


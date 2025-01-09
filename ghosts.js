window.onload = async function loadTimesheet() {
    var playerData = await loadPlayer();
    var playerDataGhosts = playerData.ghosts.filter(playerDataGhosts => playerDataGhosts.playersFastest == true);
    var trackData = await loadTracks();
    for (var cups of trackData.cups) {
        for (var tracks of cups.tracks) {
            for (var track of tracks.versions) {
                var ghost = playerDataGhosts.filter(ghost => ghost._links.leaderboard.href == track.link);
                var ghost200cc = playerDataGhosts.filter(ghost200cc => ghost200cc._links.leaderboard.href == track["200cclink"]);
                var flapGhost = await findFlap(playerData, track, false);
                var flapGhost200cc = await findFlap(playerData, track, true);
                if (ghost.length == 1 || ghost200cc.length == 1) {
                    var td1 = '<td> </td>';
                    var td2 = '<td> </td>';
                    var td3 = '<td> </td>';
                    var td4 = '<td> </td>';
                    if (ghost.length == 1) {
                        var stats = await loadStats(ghost[0]._links.item.href);
                        td1 = '<td>' + stats.finishTimeSimple + " - " + stats.player + '</td>';
                        var flapStats = await loadStats(flapGhost[0]._links.item.href);
                        td2 = '<td>' + flapStats.finishTimeSimple + " - " + flapStats.player + '</td>';
                    };
                    if (ghost200cc.length == 1) {
                        var stats = await loadStats(ghost200cc[0]._links.item.href);
                        td3 = '<td>' + stats.finishTimeSimple + " - " + stats.player + '</td>';
                        var flapStats = await loadStats(flapGhost200cc[0]._links.item.href);
                        td4 = '<td>' + flapStats.finishTimeSimple + " - " + flapStats.player + '</td>';
                    };
                    await addTR(tracks.name, track.category, td1, td2, td3, td4);
                };
            };
        };
    };
}
async function loadPlayer() {
    var playerID = "B6CAF739826331DF";
    var playerPage = "https://tt.chadsoft.co.uk/players/" + playerID.substring(0, 2) + "/" + playerID.substring(2) + ".json";
    return fetch(playerPage).then(res => res.json());
}
async function loadTracks() {
    return fetch("./tracks.json").then(res => res.json());
}
async function loadStats(link) {
    return fetch("https://tt.chadsoft.co.uk" + link).then(res => res.json());
}
async function addTR(name, category, td1, td2, td3, td4) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + name + " - " + category + '</td>' + td1 + td2 + td3 + td4;
    var table = document.getElementById("sheet");
    table.appendChild(tr);
}
async function findFlap(playerData, track, cc) {
    var ghosts = cc 
        ? playerData.ghosts.filter(ghost => ghost._links.leaderboard.href == track["200cclink"])
        : playerData.ghosts.filter(ghost => ghost._links.leaderboard.href == track.link);
    var flapTimes = [];
    for (let index = 0; index < ghosts.length; index++) {
        var flapTime = ghosts[index].bestSplitSimple.split(":");
        flapTimes.push(parseFloat(flapTime[0]) * 60 + parseFloat(flapTime[1]));
    }
    if (flapTimes.length > 0) {
        var flapGhost = Math.min(...flapTimes);
        var ghost = ghosts.filter(ghost => {
            var split = ghost.bestSplitSimple.split(":");
            var ghostTime = parseFloat(split[0]) * 60 + parseFloat(split[1]);
            return ghostTime === flapGhost;
        });
        return ghost;
    }
    return [];
}
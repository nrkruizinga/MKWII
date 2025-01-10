var index2 = 0;
window.addEventListener("load", async function () {
    index2 = 0;
    document.getElementById('json2').innerHTML = "<i>checking for new times...</i>";
    await checkForUpdates();
}, false);
async function checkForUpdates() {
    var classes = ["150cc", "200cc", "150ccflap", "200ccflap"];
    var playerData = await loadPlayer();
    var playerDataGhost = playerData.ghosts.filter(playerDataGhost => playerDataGhost.playersFastest == true);
    var trackData = await getJsonData();
    for (var cups of trackData.cups) {
        for (var tracks of cups.tracks) {
            for (var track of tracks.versions) {
                for (var c of classes) {
                    switch (c) {
                        case "150cc":
                            var ghost = playerDataGhost.filter(ghost => ghost._links.leaderboard.href == track.link);
                            break;
                        case "200cc":
                            var ghost = playerDataGhost.filter(ghost => ghost._links.leaderboard.href == track["200cclink"]);
                            break;
                        case "150ccflap":
                            var ghosts = playerData.ghosts.filter(ghost =>
                                track.flaplink.indexOf(ghost.trackId) > -1 &&
                                track.flaplink.indexOf((
                                    ghost.categoryId === 20 || ghost["200cc"] === true
                                        ? 4
                                        : ghost.categoryId === 16
                                            ? 0
                                            : ghost.categoryId ?? 0
                                ) + "-fast-lap") > -1
                            );
                            var ghost = await findFlap(ghosts);
                            break;
                        case "200ccflap":
                            var ghosts = playerData.ghosts.filter(ghost =>
                                track["flap200cclink"].indexOf(ghost.trackId) > -1 &&
                                track["flap200cclink"].indexOf((
                                    ghost.categoryId === 20
                                        ? 4
                                        : ghost.categoryId === 16 || ghost["200cc"] === false
                                            ? 0
                                            : ghost.categoryId ?? 4
                                ) + "-fast-lap") > -1
                            );
                            var ghost = await findFlap(ghosts);
                            break;
                        default:
                            break;
                    };
                    if (ghost.length > 0) {
                        if (track[c].time != ghost[0].finishTimeSimple && track[c].time != ghost[0].bestSplitSimple) {
                            if (c == "150cc" || c == "200cc") {
                                console.log("trying: " + c + " " + tracks.name + " " + track.category);
                                console.log("time in local JSON file: " + track[c].time + " - vs - time in online database: " + ghost[0].finishTimeSimple);
                                track[c] = await updateJsonData(c, track);
                                console.log(c + " " + tracks.name + " " + track.category + " has successfully added itself!");
                            } else {
                                console.log("trying: " + c + " " + tracks.name + " " + track.category);
                                console.log("time in local JSON file: " + track[c].time + " - vs - time in online database: " + ghost[0].bestSplitSimple);
                                track[c] = await updateJsonData(c, track);
                                console.log(c + " " + tracks.name + " " + track.category + " has successfully added itself!");
                            };
                            index2 += 1;
                        };
                    };
                };
            };
        };
    };
    if (index2 == 0) {
        console.log("no updates");
        await showLink();
    } else {
        console.log(index2 + " updates");
        await showLink(trackData);
    };
}
async function loadPlayer() {
    var playerID = "B6CAF739826331DF";
    var playerPage = "https://tt.chadsoft.co.uk/players/" + playerID.substring(0, 2) + "/" + playerID.substring(2) + ".json";
    return fetch(playerPage).then(res => res.json());
}
async function findFlap(ghosts) {
    var flapTimes = [];
    for (let i = 0; i < ghosts.length; i++) {
        var flapTime = ghosts[i].bestSplitSimple.split(":");
        flapTimes.push(parseFloat(flapTime[0]) * 60 + parseFloat(flapTime[1]));
    };
    if (flapTimes.length > 0) {
        var flapGhost = Math.min(...flapTimes);
        var ghost = ghosts.filter(ghost => {
            var split = ghost.bestSplitSimple.split(":");
            var ghostTime = parseFloat(split[0]) * 60 + parseFloat(split[1]);
            return ghostTime === flapGhost;
        });
        return ghost;
    };
    return [];
}
async function updateJsonData(c, track) {
    switch (c) {
        case "150cc":
            var trackDataAll = await loadStats(track.link);
            break;
        case "200cc":
            var trackDataAll = await loadStats(track["200cclink"]);
            break;
        case "150ccflap":
            var trackDataAll = await loadStats(track.flaplink);
            break;
        case "200ccflap":
            var trackDataAll = await loadStats(track["flap200cclink"]);
            break;
        default:
            break;
    };
    var trackData = trackDataAll.ghosts.filter(trackData => trackData.playersFastest == true);
    var ghost = trackData.filter(myGhost => myGhost.playerId == "B6CAF739826331DF");
    if (c == "150cc" || c == "200cc") {
        track[c] = {
            "wrTime": trackData[0].finishTimeSimple,
            "myRank": (ghost[0].leaderboardPlayerId + 1),
            "total": trackData.length,
            "top": ((ghost[0].leaderboardPlayerId + 1) / trackData.length * 100).toFixed(2),
            "time": ghost[0].finishTimeSimple
        };
    } else {
        track[c] = {
            "wrTime": trackData[0].bestSplitSimple,
            "myRank": (ghost[0].leaderboardPlayerId + 1),
            "total": trackData.length,
            "top": ((ghost[0].leaderboardPlayerId + 1) / trackData.length * 100).toFixed(2),
            "time": ghost[0].bestSplitSimple
        };
    };
    return track[c];
}
async function getJsonData() {
    return fetch("./stub.json").then(res => res.json());
}
async function loadStats(link, options = {}, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch("https://tt.chadsoft.co.uk" + link, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            };
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === retries) {
                throw new Error(`All ${retries} attempts failed.`);
            };
            await new Promise(resolve => setTimeout(resolve, delay));
        };
    };
}
async function showLink(json = null) {
    var b = await fetch("./stub.json").then(res => res.json());
    if (json == null) {
        localStorage.setItem("storeData", JSON.stringify(b));
        json = b;
    } else {
        localStorage.setItem("storeData", JSON.stringify(json));
    };
    var jsonse = JSON.stringify(json);
    var blob = new Blob([jsonse], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    index2 > 0
        ? (a.textContent = (index2).toString() + " new time(s)", a.download = "stub.json", a.href = url)
        : a.textContent = "No updates";
    a.id = "json2";
    document.getElementById('json2').parentNode.replaceChild(a, document.getElementById('json2'));
}


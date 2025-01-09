var index = 0;
window.addEventListener("load", async function () {
    showLink();
    updateJsonData("150cc");
}, false);
async function updateJsonData(c) {
    console.log(c);
    var json = await getJsonData();
    for (var cups of json.cups) {
        for (var tracks of cups.tracks) {
            for (var track of tracks.versions) {
                if (track[c] == undefined || track[c].length != undefined) {
                    console.log("trying: " + tracks.name + " " + track.category);
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
                    var myGhost = trackData.filter(myGhost => myGhost.playerId == "B6CAF739826331DF");
                    if (myGhost.length != 0) {
                        switch (c) {
                            case "150cc":
                            case "200cc":
                                track[c] = {
                                        "wrTime": trackData[0].finishTimeSimple,
                                        "myRank": (myGhost[0].leaderboardPlayerId + 1),
                                        "total": trackData.length,
                                        "top": ((myGhost[0].leaderboardPlayerId + 1) / trackData.length * 100).toFixed(2)
                                    };
                                break;
                            case "150ccflap":
                            case "200ccflap":
                                track[c] = {
                                        "wrTime": trackData[0].bestSplitSimple,
                                        "myRank": (myGhost[0].leaderboardPlayerId + 1),
                                        "total": trackData.length,
                                        "top": ((myGhost[0].leaderboardPlayerId + 1) / trackData.length * 100).toFixed(2)
                                    };
                                break;
                            default:
                                break;
                        };
                        localStorage.setItem("storeData", JSON.stringify(json));
                        var jsonse = JSON.stringify(json);
                        var blob = new Blob([jsonse], { type: "application/json" });
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = "stub.json";
                        a.textContent = "Download stub.json " + index.toString() + "x";
                        a.id = "json2"
                        document.getElementById('json2').parentNode.replaceChild(a, document.getElementById('json2'));
                        index += 1;
                        console.log(tracks.name + " " + track.category + " has successfully added itself!");
                    } else {
                        console.log("no ghosts for this version");
                        track[c] = {};
                        localStorage.setItem("storeData", JSON.stringify(json));
                    };
                } else {
                    console.log(tracks.name + " " + track.category + " is skipped");
                };
            }
        }
    }
}
async function loadPlayer() {
    var playerID = "B6CAF739826331DF";
    var playerPage = "https://tt.chadsoft.co.uk/players/" + playerID.substring(0, 2) + "/" + playerID.substring(2) + ".json";
    return fetch(playerPage).then(res => res.json());
}
async function getJsonData() {
    var data = JSON.parse(localStorage.getItem("storeData"));
    if (data == null) {
        return fetch("./stub.json").then(res => res.json());
    } else {
        return data;
    }
}
async function loadStats(link) {
    return fetchWithRetry("https://tt.chadsoft.co.uk" + link);
}
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options);

            // Controleer of de response geslaagd is (status 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json(); // Of response.text(), afhankelijk van wat je verwacht
        } catch (error) {
            console.error(`Attempt ${attempt} failed: ${error.message}`);

            if (attempt === retries) {
                throw new Error(`All ${retries} attempts failed.`);
            }

            // Wacht even voordat je opnieuw probeert
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
async function showLink() {
    var b = await fetch("./stub.json").then(res => res.json());
    var json = JSON.parse(localStorage.getItem("storeData"));
    var data = [];
    var data2 = [];
    for (var cups of json.cups) {
        for (var tracks of cups.tracks) {
            for (var track of tracks.versions) {
                if (track["150cc"] != undefined) {
                    data.push("a");
                }
                if (track["200cc"] != undefined) {
                    data.push("b");
                }
            };
        };
    };
    for (var cups of b.cups) {
        for (var tracks of cups.tracks) {
            for (var track of tracks.versions) {
                if (track["150cc"] != undefined) {
                    data2.push("a");
                }
                if (track["200cc"] != undefined) {
                    data2.push("b");
                }
            };
        };
    };
    var jsonse = JSON.stringify(json);
    var blob = new Blob([jsonse], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = "stub.json";
    a.textContent = "Download stub.json " + (data.length - data2.length).toString() + "x";
    a.id = "json2"
    document.getElementById('json2').parentNode.replaceChild(a, document.getElementById('json2'));
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
async function findFlapWR(data, track, cc, myFlap) {
    console.log(data.length);
    console.log(myFlap);
    const flapTimes = [];
    for (let index = 0; index < data.length; index++) {
        var ghostData = await loadStats(data[index]._links.item.href);
        console.log(ghostData);
        var flapTime = ghostData.bestSplitSimple.split(":");
        flapTimes.push(parseFloat(flapTime[0]) * 60 + parseFloat(flapTime[1]));
    }
    if (flapTimes.length > 0) {
        flapTimes.sort((a, b) => a - b);
        console.log(flapTimes);
        var myGhost = flapTimes.find(myFlap);//?
        console.log(myGhost);
        var myRank = flapTimes.indexOf(myGhost);
        console.log(myRank);
        var flapGhost = flapTimes[0];
        var minutes = Math.floor(flapGhost / 60).toString().padStart(2, '0');
        var seconds = (flapGhost % 60).toFixed(3).padStart(6, '0');
        var ghost = minutes + ":" + seconds;
        return {
            ghost: ghost,
            myRank: myRank
        };
    }
    return [];
}


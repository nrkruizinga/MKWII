var index = 0;
var playerData;
var trackData;
window.onload = async function () {
    playerData = await loadPlayer();
    trackData = await getTrackData();
    await loadTimesheet("150cc");
}
async function loadTimesheet(c) {
    index = 0;
    var new_tbody = document.createElement('tbody');
    new_tbody.id = "tbody";
    var old_tbody = document.getElementById('tbody');
    old_tbody.parentNode.replaceChild(new_tbody, old_tbody);
    document.getElementById(c).style.backgroundColor = "#303030";
    if (c == "150cc") {
        document.getElementById("200cc").style.backgroundColor = "#1f1f1f";
        document.getElementById("150ccflap").style.backgroundColor = "#1f1f1f";
        document.getElementById("200ccflap").style.backgroundColor = "#1f1f1f";
    } else if (c == "200cc") {
        document.getElementById("150cc").style.backgroundColor = "#1f1f1f";
        document.getElementById("150ccflap").style.backgroundColor = "#1f1f1f";
        document.getElementById("200ccflap").style.backgroundColor = "#1f1f1f";
    } else if (c == "150ccflap") {
        document.getElementById("150cc").style.backgroundColor = "#1f1f1f";
        document.getElementById("200cc").style.backgroundColor = "#1f1f1f";
        document.getElementById("200ccflap").style.backgroundColor = "#1f1f1f";
    } else if (c == "200ccflap") {
        document.getElementById("150cc").style.backgroundColor = "#1f1f1f";
        document.getElementById("200cc").style.backgroundColor = "#1f1f1f";
        document.getElementById("150ccflap").style.backgroundColor = "#1f1f1f";
    };
    var playerDataGhost = playerData.ghosts.filter(playerDataGhost => playerDataGhost.playersFastest == true);
    for (var cups of trackData.cups) {
        for (var tracks of cups.tracks) {
            for (var track of tracks.versions) {
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
                    await addTR(ghost, track, c);
                };
            };
        };
    };
}
async function findFlap(ghosts) {
    var flapTimes = [];
    for (let index = 0; index < ghosts.length; index++) {
        var flapTime = ghosts[index].bestSplitSimple.split(":");
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
async function loadPlayer() {
    var playerID = "B6CAF739826331DF";
    var playerPage = "https://tt.chadsoft.co.uk/players/" + playerID.substring(0, 2) + "/" + playerID.substring(2) + ".json";
    return fetch(playerPage).then(res => res.json());
}
async function getTrackData() {
    var data = JSON.parse(localStorage.getItem("storeData"));
    if (data == null) {
        return fetch("./stub.json").then(res => res.json());
    } else {
        return data;
    }
}
async function loadStats(link) {
    return fetch("https://tt.chadsoft.co.uk" + link).then(res => res.json());
}
async function getDriverAndVehicle(stats) {
    var driver, vehicle = "";
    switch (stats.driverId) {
        case 22:
            driver = "Funky Kong";
            break;
        case 15:
            driver = "Daisy";
            break;
        case 12:
            driver = "Baby Luigi";
            break;
        case 13:
            driver = "Toadette";
            break;
        case 5:
            driver = "Dry Bones";
            break;
        case 4:
            driver = "Baby Daisy";
            break;
        default:
            driver = stats.driverId;
            break;
    };
    switch (stats.vehicleId) {
        case 32:
            vehicle = "Spear";
            break;
        case 23:
            vehicle = "Flame Runner";
            break;
        case 22:
            vehicle = "Mach Bike";
            break;
        case 30:
            vehicle = "Magikruiser";
            break;
        case 27:
            vehicle = "Quacker";
            break;
        default:
            vehicle = stats.vehicleId;
            break;
    };
    return {
        driver: driver,
        vehicle: vehicle
    };
}
async function addTR(ghost, track, c) {
    var stats = await loadStats(ghost[0]._links.item.href);
    var result = await getDriverAndVehicle(stats);
    const date = new Date(stats.dateSet);
    const formattedDate = date.toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    var tr = document.createElement('tr');
    if (c == "150cc" || c == "200cc") {
        tr.innerHTML = '<td>' + (index += 1) + '</td>' +
            '<td>' + stats.player + '</td>' +
            '<td>' + stats.trackName + " - " + track.category + '</td>' +
            '<td>' + stats.finishTimeSimple + '</td>' +
            '<td>' + track[c].wrTime + '</td>' +
            '<td>' + track[c].myRank + '</td>' +
            '<td>' + track[c].total + '</td>' +
            '<td>' + track[c].top + '</td>' +
            '<td>' + formattedDate + '</td>' +
            '<td>' + stats.splitsSimple[0] + '</td>' +
            '<td>' + stats.splitsSimple[1] + '</td>' +
            '<td>' + stats.splitsSimple[2] + '</td>' +
            '<td>' + result.driver + '</td>' +
            '<td>' + result.vehicle + '</td>';
    } else {
        tr.innerHTML = '<td>' + (index += 1) + '</td>' +
            '<td>' + stats.player + '</td>' +
            '<td>' + stats.trackName + " - " + track.category + '</td>' +
            '<td>' + stats.bestSplitSimple + '</td>' +
            '<td>' + track[c].wrTime + '</td>' +
            '<td>' + track[c].myRank + '</td>' +
            '<td>' + track[c].total + '</td>' +
            '<td>' + track[c].top + '</td>' +
            '<td>' + formattedDate + '</td>' +
            '<td>' + '</td>' +
            '<td>' + '</td>' +
            '<td>' + '</td>' +
            '<td>' + result.driver + '</td>' +
            '<td>' + result.vehicle + '</td>';
    };
    var table = document.getElementById("tbody");
    table.appendChild(tr);
}
function sortTable(columnIndex) {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("sheet");
    switching = true;
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < (rows.length - 1); i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
            //check if the two rows should switch place:
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                //if so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}
function sortTableNum(columnIndex) {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("sheet");
    switching = true;
    // Loop totdat er geen wisselingen meer nodig zijn
    while (switching) {
        switching = false;
        rows = table.rows;
        // Loop door alle rijen behalve de eerste (header)
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            // Haal de waarden op van de cellen die je wilt vergelijken
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
            // Zet de waarden om naar getallen voor numerieke vergelijking
            var numX = parseFloat(x.innerHTML) || 0;
            var numY = parseFloat(y.innerHTML) || 0;
            // Controleer of de rijen moeten wisselen
            if (numX > numY) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            // Wissel de rijen en markeer dat er een wissel is geweest
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}
function sortTableDate(columnIndex) {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("sheet");
    switching = true;
    // Loop totdat er geen wisselingen meer nodig zijn
    while (switching) {
        switching = false;
        rows = table.rows;
        // Loop door alle rijen behalve de eerste (header)
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            // Haal de waarden op van de cellen die je wilt vergelijken
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];
            // Zet de waarden om naar Date objecten
            var dateX = new Date(x.innerHTML.split("-").reverse().join("-"));
            var dateY = new Date(y.innerHTML.split("-").reverse().join("-"));
            // Controleer of de rijen moeten wisselen
            if (dateX > dateY) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            // Wissel de rijen en markeer dat er een wissel is geweest
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

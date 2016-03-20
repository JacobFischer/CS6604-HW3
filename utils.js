
function getUrlParameter(sParam, def) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }

    return def;
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function DefaultNumber(num, def) {
    return typeof(num) === "number" && !isNaN(num) ? num : def;
};

var seed = 123896;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

Array.prototype.randomElement = function() {
    return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.last = function(i) {
    i = i || 0;
    return this[this.length - i - 1];
};

Array.prototype.removeElement = function(item) {
    var index = this.indexOf(item);

    if(index > -1) {
        this.splice(index, 1);
    }
};

$print = undefined;
function print(str) {
    if($print) {
        $print.append(
            $("<li>").html(str)
        );
    }
};

function clearPrint() {
    if($print) {
        $print.html("");
        $selectedInfo.html("");
    }
};

function formatInfo(info) {
    return String("<h2>" + info.title + "</h2><pre>" + JSON.stringify(info.data, null, 4) + "</pre>");
};

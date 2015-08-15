var context = new window.AudioContext();
var bufferCollection = [], source, gainNode, destination;
var audioList = [];
var dropZoneObj = new DropZone(), dropZone;
var pausedAt, paused, startedAt;
var normal, classical, jazz, rock, pop;
var buffer;
var currentPlayId = -1;
var timeAudio, playImg, pauseImg, timeRange, equalizer, unmuteElement, muteElement, scopeElement;
var text = {
    defaultDropZone: "Для загрузки, перетащите файл сюда."
}
destination = context.destination;
gainNode = context.createGain();
var filters = createFilters();
function createFilter (frequency) {
    var filter = context.createBiquadFilter();
     
    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.Q.value = 1;
    filter.gain.value = 0;

    return filter;
};
function createFilters () {
    var frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
      filters = frequencies.map(createFilter);

    filters.reduce(function (prev, curr) {
        prev.connect(curr);
        return curr;
    });

    return filters;
};

var equalize = function () {
    gainNode.connect(filters[0]);
    filters[filters.length - 1].connect(context.destination);
};
equalize();


var createInputs = function () {
    var inputs = [],
      node,
      i;
    for (i = 0; i < 10; i++) {
        node = document.createElement('input');
        equalizer.appendChild(node);
        inputs.push(node);
    }
    [].forEach.call(inputs, function (item, i) {
        item.setAttribute('min', -1.5);
        item.setAttribute('max', 1.5);
        item.setAttribute('step', 0.01);
        item.setAttribute('value', 0);
        item.setAttribute('type', 'range');
        item.addEventListener('change', function (e) {
            filters[i].gain.value = e.target.value;
        }, false);
    });
    function changeFilter(i, value) {
        filters[i].gain.value = value;
        inputs[i].value = value;
    }
    pop = function () {
        var arr = [-0.15, -0.1, -0.05, 0.1,0.2, 0.2,0.1,0,-0.1,-0.15];
        [].forEach.call(arr, function(item, i) {
            changeFilter(i, item);
        });
    }
    rock = function () {
        var arr = [0.3, 0.2, 0.18, 0.08,-0.1, -0.1,0.0,0.1,0.3,0.3];
        [].forEach.call(arr, function(item, i) {
            changeFilter(i, item);
        });
    }
    jazz = function () {
        var arr = [0.2, 0.18, 0.05, 0.1,-0.18, -0.18,-0.04,0.04,0.18,0.2];
        [].forEach.call(arr, function(item, i) {
            changeFilter(i, item);
        });
    }
    classical = function () {
        var arr = [0.3, 0.2, 0.1, 0.05,-0.18, -0.18,-0.04,0.04,0.18,0.2];
        [].forEach.call(arr, function(item, i) {
            changeFilter(i, item);
        });
    }
    
    normal = function () {
        var arr = [0,0,0,0,0,0,0,0,0,0];
        [].forEach.call(arr, function(item, i) {
            changeFilter(i, item);
        });
    }
}
var audio_file = function (elm) {
    var files = elm.files;
    var file = URL.createObjectURL(files[0]);
    loadSoundFile(file);
};

function DropZone() {
    var element;
    this.getElement = function () {
        return element;
    }

    this.setElement = function (elm) {
        element = document.getElementById(elm);
    }

    function clearStyle() {
        setTimeout(function () {
            removeClass('drop');
            removeClass('error');
        }, 5000);
    }
    function removeClass(classname) {
        var cn = element.className;
        var rxp = new RegExp("\\s?\\b" + classname + "\\b", "g");
        cn = cn.replace(rxp, '');
        element.className = cn;
    }
    function addClass(classname) {
        var cn = element.className;
        if (cn.indexOf(classname) != -1) {
            return;
        }
        if (cn != '') {
            classname = ' ' + classname;
        }
        element.className = cn + classname;
    }

    this.addClass = addClass;
    this.removeClass = removeClass;
    this.clearStyle = clearStyle;
}

function removeClass(classname, element) {
    var cn = element.className;
    var rxp = new RegExp("\\s?\\b" + classname + "\\b", "g");
    cn = cn.replace(rxp, '');
    element.className = cn;
}
function addClass(classname, element) {
    var cn = element.className;
    if (cn.indexOf(classname) != -1) {
        return;
    }
    if (cn != '') {
        classname = ' ' + classname;
    }
    element.className = cn + classname;
}
var loadSoundFile = function (audio) {
    return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(audio.file);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onprogress = uploadProgress;
        xhr.onload = function (e) {
            context.decodeAudioData(this.response,
                function (decodedArrayBuffer) {
                    bufferCollection.push({
                        id: audio.id,
                        file: audio.file,
                        buffer: decodedArrayBuffer
                    });
                    resolve(e);
                }, function (e) {
                    console.log('Error decoding file', e);
                    reject(e);
                });

        };
        xhr.onerror = function (e) {
            console.log('Error load file', e);
            reject(e);
        }
        xhr.send();
    });
}
getFileById = function (id) {
    for (var i = 0; i < bufferCollection.length; i++) {
        if (id === bufferCollection[i].id) {
            return bufferCollection[i];
        }
    }
}
var addBuffer = function (e) {
    currentPlayId = parseInt(e.currentTarget.dataset.id);
    var audioFile = getFileById(currentPlayId);
    buffer = audioFile.buffer;
    document.getElementById('current-name-audio').innerText = audioFile.file.name;
    play(true);
}
var playInterval;

var play = function (isNew, startTime) {
    if (!buffer) return;
    if (source && isNew && startTime == undefined) {
        stop();
    }
    source = context.createBufferSource();
    paused = false;
    source.buffer = buffer;
    source.connect(gainNode);

    if (pausedAt) {
        startedAt = Date.now() - pausedAt;
        source.start(0, pausedAt / 1000);
    }
    else {
        if (!startTime)
            startTime = 0;
        startedAt = Date.now() - startTime * 1000;
        source.start(0, startTime);
        changeValueRange();
    }
    timeAudio.children[1].innerText = getMinSec(source.buffer.duration);
    timeRange.max = source.buffer.duration;
    removeClass('hide', timeAudio);
    changeValueRange();

    source.onended = function () {
        if (((Date.now() - startedAt) - source.buffer.duration) / 1000 + 0.5 >= source.buffer.duration)
            stop();
    }

    addClass('hide', playImg);
    removeClass('hide', pauseImg);
    playInterval = setInterval(changeValueRange, 500);
    function changeValueRange() {
        timeAudio.children[0].innerText = getMinSec(((Date.now() - startedAt) - source.buffer.duration) / 1000);
        timeRange.value = (Date.now() - startedAt) / 1000;
    }
};

var pause = function () {
    clearInterval(playInterval);
    source.stop(0);
    pausedAt = Date.now() - startedAt;
    paused = true;
    removeClass('hide', playImg);
    addClass('hide', pauseImg);
};

var stop = function () {
    if (!source) return;
    clearInterval(playInterval);
    source.stop(0);
    pausedAt = undefined;
    currentPlayId = -1;
    addClass('hide', timeAudio);
    removeClass('hide', playImg);
    addClass('hide', pauseImg);
}
var oldGainValue = 1;
var mute = function () {
    oldGainValue = gainNode.gain.value;
    changeValue(0);
    addClass('hide', muteElement);
    removeClass('hide', unmuteElement);
}
var unmute = function () {
    changeValue(oldGainValue);
    removeClass('hide', muteElement);
    addClass('hide', unmuteElement);
}
function changeTrack(val) {
    clearInterval(playInterval);
    source.stop(0);
    pausedAt = undefined;
    play(true, val);
    console.log('text', val);
}

function getMinSec(time) {
    time = Math.round(time);
    var mins = Math.floor((time % 3600) / 60);
    var secs = time % 60;
    var ret = "";
    ret += mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}

function removeFile(element) {
    for (var i = 0; i < audioList.length; i++) {
        if (audioList[i].id == element.currentTarget.dataset.id) {
            if (currentPlayId == audioList[i].id)
                stop();
            audioList.splice(i, 1);
            element.currentTarget.parentElement.remove();
            stop();
            source.buffer = undefined;
            return;
        }
    }
}

var chooseFile = function (event) {
    var files;
    if (event.dataTransfer !== undefined) {
        event.preventDefault();
        files = event.dataTransfer.files;
    } else {
        files = event.files;
    }
    var oldCountAudio = audioList.length;
    filterAudio(files);
    addViewToAudioList(oldCountAudio);
    dropZoneObj.clearStyle();
};
function changeValue(val) {
    if (gainNode && gainNode.gain) {
        gainNode.gain.value = val;
    }
    console.log('text', val);
};

function addViewToAudioList(oldCount) {

    for (var i = oldCount; i < audioList.length; i++) {
        (function (j) {
            loadSoundFile(audioList[j]).then(function () {
                dropZone.innerText = text.defaultDropZone;
                var elementAudioList = document.getElementById('list-element');
                var spanRemove = document.createElement('span');
                spanRemove.innerHTML = '\tx';
                spanRemove.className = 'remove';
                spanRemove.dataset.id = audioList[j].id;
                spanRemove.addEventListener("click", removeFile);

                var spanPlay = document.createElement('span');
                spanPlay.innerHTML = '\tplay';
                spanPlay.className = 'play';
                spanPlay.dataset.id = audioList[j].id;
                spanPlay.addEventListener("dblclick", addBuffer);

                var li = document.createElement('li');
                li.innerHTML = audioList[j].file.name;
                li.appendChild(spanRemove);
                li.dataset.id = audioList[j].id;
                li.addEventListener("dblclick", addBuffer);
                elementAudioList.appendChild(li);
            }, function (err) {
                console.log('Error load: ', err);
            });
        })(i);

    }
}
function filterAudio(files) {
    for (var i = 0; i < files.length; i++) {
        if (files[i].type.split('/')[0] !== 'audio') {
            dropZoneObj.addClass('error');
            dropZoneObj.removeClass('hover');
            dropZoneObj.removeClass('drop');
            dropZone.innerText += '\nфайл ' + files[i].name + ' не определен как тип "audio".';
        } else {
            dropZoneObj.addClass('drop');
            dropZoneObj.removeClass('error');
            files[i].id = audioList.length + 1;
            var audio = new AudioFile();
            audio.id = audioList.length + 1;
            audio.file = files[i];
            audioList.push(audio);
        }
    }
}

function uploadProgress(event) {
    var percent = parseInt(event.loaded / event.total * 100);
    dropZone.innerText = 'Загрузка: ' + percent + '%';
}

function AudioFile() {
    this.id = NaN;
    this.file = {};
}
window.onload = function () {
    dropZoneObj.setElement('drop-zone');

    timeAudio = document.getElementById('time-audio');
    pauseImg = document.getElementById('pause-img');
    playImg = document.getElementById('play-img');
    timeRange = document.getElementById('time-range');
    equalizer = document.getElementById('equalizer');
    unmuteElement = document.getElementById('unmute-img');
    muteElement = document.getElementById('mute-img');
    addClass('hide', pauseImg);
    addClass('hide', timeAudio);

    dropZone = dropZoneObj.getElement();
    if (typeof (window.FileReader) == 'undefined') {
        dropZone.text('Не поддерживается браузером!');
        dropZoneObj.addClass('error');
    }
    dropZone.ondragover = function () {
        dropZoneObj.addClass('hover');
        return false;
    };

    dropZone.ondragleave = function () {
        dropZoneObj.removeClass('hover');
        return false;
    };

    createInputs();
    unmute();
    dropZone.ondrop = chooseFile;
}

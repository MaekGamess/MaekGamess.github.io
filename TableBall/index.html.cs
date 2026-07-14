< !DOCTYPE html >
< html lang = "en" >
< head >
< meta charset = "utf-8" >
< meta name = "viewport" content = "width=device-width, initial-scale=1.0, viewport-fit=cover" >

< title > Unity WebGL </ title >

< style >
html, body {
    margin: 0;
padding: 0;
width: 100 %;
height: 100 %;
overflow: hidden;
background: #000;
}

#unity-container {
    position: fixed;
inset: 0;
width: 100vw;
height: 100vh;
}

#unity-canvas {
    width: 100 %;
height: 100 %;
display: block;
background: #000;
}

#unity-loading-bar {
    position: absolute;
left: 50 %;
top: 50 %;
transform: translate(-50 %, -50 %);
width: 300px;
}

#unity-progress-bar-empty {
    width: 100 %;
height: 20px;
background: #444;
}

#unity-progress-bar-full {
    width: 0 %;
height: 100 %;
background: #4CAF50;
}

#unity-warning {
    position: absolute;
top: 10px;
left: 10px;
right: 10px;
color: white;
text - align: center;
}
</ style >
</ head >

< body >

< div id = "unity-container" >
    < canvas id = "unity-canvas" ></ canvas >

    < div id = "unity-loading-bar" >
        < div id = "unity-progress-bar-empty" >
            < div id = "unity-progress-bar-full" ></ div >
        </ div >
    </ div >

    < div id = "unity-warning" ></ div >
</ div >

< script >
const buildUrl = "Build";
const loaderUrl = buildUrl + "/{{{ LOADER_FILENAME }}}";

const config = {
    dataUrl: buildUrl + "/{{{ DATA_FILENAME }}}",
    frameworkUrl: buildUrl + "/{{{ FRAMEWORK_FILENAME }}}",
    codeUrl: buildUrl + "/{{{ CODE_FILENAME }}}",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "{{{ COMPANY_NAME }}}",
    productName: "{{{ PRODUCT_NAME }}}",
    productVersion: "{{{ PRODUCT_VERSION }}}",
    matchWebGLToCanvasSize: true,
    devicePixelRatio: window.devicePixelRatio || 1
};

const canvas = document.querySelector("#unity-canvas");
const loadingBar = document.querySelector("#unity-loading-bar");
const progressBarFull = document.querySelector("#unity-progress-bar-full");
const warningBanner = document.querySelector("#unity-warning");

function unityShowBanner(msg, type)
{
    warningBanner.innerHTML = msg;
}

const script = document.createElement("script");
script.src = loaderUrl;

script.onload = () => {
    createUnityInstance(canvas, config, (progress) => {
        progressBarFull.style.width = (100 * progress) + "%";
    }).then((unityInstance) => {
        loadingBar.style.display = "none";
    }).catch((message) => {
        alert(message);
    });
};

document.body.appendChild(script);

// Keep canvas resized
function resizeCanvas()
{
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
</ script >

</ body >
</ html >

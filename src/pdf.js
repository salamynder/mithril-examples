import m from 'mithril'
import stream from 'mithril/stream';
import {PDFJS} from 'pdfjs-dist'


var pdfDoc = null,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.8;

let pdfTEST = {
    oninit(vnode){
        vnode.state.pdfPage = stream("1") 
        vnode.state.renderPage = function renderPage(num, canvas, ctx) {
            pageRendering = true;
            // Using promise to fetch the page
            if (typeof num === 'string') num = Number(num)
            vnode.state.pdfDoc.getPage(num).then(function(page) {
                var viewport = page.getViewport(scale);
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);

                // Wait for rendering to finish
                renderTask.promise.then(function() {
                    pageRendering = false;
                    if (pageNumPending !== null) {
                        // New page rendering is pending
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                });
            });
        }
    },
    oncreate: (vnode) => {
        var url = 'frank-draft-2016.pdf';

        // Disable workers to avoid yet another cross-origin issue (workers need
        // the URL of the script to be loaded, and dynamically loading a cross-origin
        // script does not work).
        // PDFJS.disableWorker = true;

        // The workerSrc property shall be specified.
        PDFJS.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

        // Asynchronous download of PDF
        var loadingTask = PDFJS.getDocument(url);
        loadingTask.promise.then(function(pdf) {
            console.log('PDF loaded');
            
            // Fetch the first page
            var pageNumber = 1;
            pdf.getPage(pageNumber).then(function(page) {
                console.log('Page loaded');
                
                var viewport = page.getViewport(scale);

                // Prepare canvas using PDF page dimensions
                var canvas = document.getElementById('the-canvas')
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);
                renderTask.then(function () {
                    console.log('Page rendered');
                });
                vnode.state.canvas = canvas
                vnode.state.ctx = context
            });
            vnode.state.pdfDoc = pdf
            window.pdfState = vnode.state
        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });
    }  ,
    view : (vnode) => [m("form",
                         m("input#page",{onchange: m.withAttr('value', vnode.state.pdfPage)
                                         , value: vnode.state.pdfPage()})
                         , m("button", {
                             onclick: e => {
                                 e.preventDefault()
                                 vnode.state.renderPage(vnode.state.pdfPage()
                                                        , vnode.state.canvas
                                                        , vnode.state.ctx)
                             }
                         }, "Seite wechseln"))
                       , m("div#canvas-container",
                           m("canvas#the-canvas"))
                      ]
}

m.mount( document.getElementById("pdf"), pdfTEST)

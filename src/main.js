import m from 'mithril'
import R from 'ramda'
window.R = R

// Allgemeiner Weg um eine (anonyme) Komponente im Dokument einzusetzen:
// m.mount(document.body,
//        { view: () => m("p", "goooogo")}
//        )

// Dieses TODO-Beispiel ist direkt von der offiziellen Mithril-Seite. (Quelldatei:
// https://github.com/MithrilJS/mithril.js/blob/next/examples/todomvc/todomvc.js)
// Folgendes state-Objekt stellt einen Teil der Elm/Flux/Redux-Architektur dar, nämlich
// jenen der besagt, dass ein vorhersehbarer State-Container (mit Aktionen) genutzt
// werden kann. Der fehlende Teil ist die Nicht-Mutierbarkeit, die besagt, dass die
// Aktionen nicht per Seiteneffekt (wie hier) arbeiten, sondern explizit einen State
// als Argument nehmen und einen neuen State zurückgeben.


// state-Objekt mit Aktionen, die auf dem state intern (property: todos etc) ausgeführt werden:
var state = {
    dispatch: function(action, args) {
        state[action].apply(state, args || [])
        requestAnimationFrame(function() {
            localStorage["todos-mithril"] = JSON.stringify(state.todos)
        })
    },

    todos: JSON.parse(localStorage["todos-mithril"] || "[]"),
    editing: null,
    filter: "",
    remaining: 0,
    todosByStatus: [],

    createTodo: function(title) {
        state.todos.push({title: title.trim(), completed: false})
    },
    setStatuses: function(completed) {
        for (var i = 0; i < state.todos.length; i++) state.todos[i].completed = completed
    },
    setStatus: function(todo, completed) {
        todo.completed = completed
    },
    destroy: function(todo) {
        var index = state.todos.indexOf(todo)
        if (index > -1) state.todos.splice(index, 1)
    },
    clear: function() {
        for (var i = 0; i < state.todos.length; i++) {
            if (state.todos[i].completed) state.destroy(state.todos[i--])
        }
    },

    edit: function(todo) {
        state.editing = todo
    },
    update: function(title) {
        if (state.editing != null) {
            state.editing.title = title.trim()
            if (state.editing.title === "") state.destroy(state.editing)
            state.editing = null
        }
    },
    reset: function() {
        state.editing = null
    },

    computed: function(vnode) {
        state.showing = vnode.attrs.status || ""
        state.remaining = state.todos.filter(function(todo) {return !todo.completed}).length
        state.todosByStatus = state.todos.filter(function(todo) {
            switch (state.showing) {
            case "": return true
            case "active": return !todo.completed
            case "completed": return todo.completed
            }
        })
    }
}

//view
var Todos = {
    add: function(e) {
        if (e.keyCode === 13 && e.target.value) {
            state.dispatch("createTodo", [e.target.value])
            e.target.value = ""
        }
    },
    toggleAll: function() {
        state.dispatch("setStatuses", [document.getElementById("toggle-all").checked])
    },
    toggle: function(todo) {
        state.dispatch("setStatus", [todo, !todo.completed])
    },
    focus: function(vnode, todo) {
        if (todo === state.editing && vnode.dom !== document.activeElement) {
            vnode.dom.value = todo.title
            vnode.dom.focus()
            vnode.dom.selectionStart = vnode.dom.selectionEnd = todo.title.length
        }
    },
    save: function(e) {
        if (e.keyCode === 13 || e.type === "blur") state.dispatch("update", [e.target.value])
        else if (e.keyCode === 27) state.dispatch("reset")
    },
    oninit: state.computed,
    onbeforeupdate: state.computed,
    view: function(vnode) {
        var ui = vnode.state
        return [
            m("header.header", [
                m("h1", "todos"),
                m("input#new-todo[placeholder='What needs to be done?'][autofocus]", {onkeypress: ui.add}),
            ]),
            m("section#main", {style: {display: state.todos.length > 0 ? "" : "none"}}, [
                m("input#toggle-all[type='checkbox']", {checked: state.remaining === 0, onclick: ui.toggleAll}),
                m("label[for='toggle-all']", {onclick: ui.toggleAll}, "Mark all as complete"),
                m("ul#todo-list", [
                    state.todosByStatus.map(function(todo) {
                        return m("li", {class: (todo.completed ? "completed" : "") + " " + (todo === state.editing ? "editing" : "")}, [
                            m(".view", [
                                m("input.toggle[type='checkbox']", {checked: todo.completed, onclick: function() {ui.toggle(todo)}}),
                                m("label", {ondblclick: function() {state.dispatch("edit", [todo])}}, todo.title),
                                m("button.destroy", {onclick: function() {state.dispatch("destroy", [todo])}}),
                            ]),
                            m("input.edit", {onupdate: function(vnode) {ui.focus(vnode, todo)}, onkeyup: ui.save, onblur: ui.save})
                        ])
                    }),
                ]),
            ]),
            state.todos.length ? m("footer#footer", [
                m("span#todo-count", [
                    m("strong", state.remaining),
                    state.remaining === 1 ? " item left" : " items left",
                ]),
                m("ul#filters", [
                    m("li", m("a[href='/']", {oncreate: m.route.link, class: state.showing === "" ? "selected" : ""}, "All")),
                    m("li", m("a[href='/active']", {oncreate: m.route.link, class: state.showing === "active" ? "selected" : ""}, "Active")),
                    m("li", m("a[href='/completed']", {oncreate: m.route.link, class: state.showing === "completed" ? "selected" : ""}, "Completed")),
                ]),
                m("button#clear-completed", {onclick: function() {state.dispatch("clear")}}, "Clear completed"),
            ]) : null,
        ]
    }
}

// m.route(document.getElementById("todoapp"), "/", {
//     "/": Todos,
//     "/:status": Todos //for the filters active, complete...!
// })


// https://mithril-examples.firebaseapp.com/
import stream from 'mithril/stream';

function todoModel() {
    const s = stream("")
    return {
        todos: []
        , newTodoText: s
        , streamTest: s.map(str => str.toUpperCase())

    };
}

const actions = {
    addTodo(model) {
        model.todos.push({
            text: model.newTodoText(),
            id: Date.now()
        });
        model.newTodoText(''); // reset
    }
    ,deleteTodo(model,todoId){
        var idx = R.findIndex(R.propEq('id', todoId), model.todos)
        if (idx > -1) model.todos.splice(idx, 1)
        // m.redraw() -- really not needed!!!!
    }
    
};

const TodoList = {
  view({ attrs }) {
    return (
      m('ul',
        attrs.todos.map((todo) =>
          m('li', { key: todo.id }
            , todo.text+" "
            , m("button",
                { onclick: () => actions.deleteTodo(model,todo.id)},
                "delete!"))
                    
        )
      )
    );
  }
};

// should not be global..?!
const model = todoModel();

function Smalltodo() {
    return {
        view() {
            return [
                m('h3', 'To-do'),
                m(TodoList, { todos: model.todos }),
                m("div", model.streamTest()),
                m('form', {
                    onsubmit(event) {
                        event.preventDefault();
                        actions.addTodo(model);
                    }
                },
                  m('input[type=text]', {
                      oninput: m.withAttr('value', model.newTodoText),
                      value: model.newTodoText()
                  }),
                  m('button[type=submit]',
                    `Add #${model.todos.length + 1}`
                   )
                 )
            ];
        }
    };
}

// m.mount( document.getElementById("smalltodo"), Smalltodo)

import {PDFJS} from 'pdfjs-dist'


var pdfDoc = null,
    pageRendering = false,
    pageNumPending = null,
    scale = 0.8;

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
                
                var scale = 1.5;
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
    view : (vnode) => [m("input#page",{onchange: m.withAttr('value', vnode.state.pdfPage)
                                      , value: vnode.state.pdfPage()})
                       , m("button", {
                           onclick: () => {
                               vnode.state.renderPage(vnode.state.pdfPage()
                                                      , vnode.state.canvas
                                                      , vnode.state.ctx)
                           }
                       }, "Seite wechseln")
                       , m( "canvas#the-canvas")
                      ]
}

m.mount( document.getElementById("pdf"), pdfTEST)

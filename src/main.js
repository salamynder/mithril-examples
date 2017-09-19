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

m.mount( document.getElementById("smalltodo"), Smalltodo)

// READING?
// [declarative templates: https://lhorie.github.io/mithril-blog/getting-over-a-fear-of-turing-complete-templates.html]
// [ex: occlusion culling:
//  - http://jsfiddle.net/7JNUy/1/ (old mithril v0.1.3)
//  - https://lhorie.github.io/mithril-blog/an-exercise-in-awesomeness.html
// ]
// [explanation of redux in regard to fractal architecture: http://antontelesh.github.io/architecture/2016/03/16/fractal-architecture.html]
// [architecture for state management, examples mostly in react: https://github.com/foxdonut/meiosis/wiki ]
// [small step tutorial using meiosis in mithril with nice fiddles: https://github.com/pakx/the-mithril-diaries/wiki/Finding-Mithril ]
// animations: https://gist.github.com/pakx/e6ee91e1789edaa5250231a8e6953934

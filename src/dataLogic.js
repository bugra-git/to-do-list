const toDoLists = {
    projects: [],
    default: [],
    
    get allTasks() {
        return [
            ...toDoLists.default,
            ...toDoLists.projects.flatMap(p => p.projectToDoList)
        ];
    },

    get today() {
        const today = new Date().toISOString().slice(0, 10);
        return toDoLists.allTasks.filter(task => task.dueDate.toISOString().slice(0,10) === today);
    },

    createProject: function(projectTitle) {
        const newProject = new Project(projectTitle);
        toDoLists.projects.push(newProject);
        saveToStorage()
        return newProject;
    },

    addToDo(titleInput, dueDateInput, projectId = null) {
        const parent = projectId ?? "default";
        const newToDo = new ToDoObject(titleInput, new Date(dueDateInput), parent);

        const arrayToPush = projectId?
            toDoLists.projects.find(p => p.id === projectId).projectToDoList : 
            toDoLists.default;

        arrayToPush.push(newToDo);

        saveToStorage()
    },

    removeProject: function(projectId) {
        toDoLists.projects = toDoLists.projects.filter(project => project.id !== projectId);

        saveToStorage()
    },

    removeDefaultItem: function(toDoId) {
        toDoLists.default = toDoLists.default.filter(todo => todo.id !== toDoId);

        saveToStorage()
    }
}

class Project {
    constructor(title) {
        this.id = crypto.randomUUID();
        this.title = title;
        this.projectToDoList = [];
    }

    removeTodo(toDoId) {
        this.projectToDoList = this.projectToDoList.filter(todo => todo.id !== toDoId);
        saveToStorage();
    }
}

class ToDoObject {
    constructor(title,dueDate,parentId) {
        this.id = crypto.randomUUID();
        this.title = title;
        this.dueDate = dueDate;
        this.checkState = "Due";
        this.parent = parentId;
        this.priority = "normal";
    }

    addDescription(description) {
        this.description = description;
        saveToStorage()
    }

    addPriority(priority) {
        this.priority = priority;
        saveToStorage()
    }

    changeCheckState() {
        this.checkState = this.checkState === "Due"? "Done":"Due";
        saveToStorage()
    }
}

function saveToStorage() {
  localStorage.setItem("todoData", JSON.stringify({
    projects: toDoLists.projects,
    default: toDoLists.default
  }));
}

function loadFromStorage() {
  const raw = localStorage.getItem("todoData");
  if (!raw) return;

  const parsed = JSON.parse(raw);

  function restoreToDo(obj) {
    const todo = new ToDoObject(obj.title, new Date(obj.dueDate), obj.parent);

    for (const key in obj) {
      if (!["title", "dueDate", "parent"].includes(key)) {
        todo[key] = obj[key];
      }
    }
    return todo;
  }

  toDoLists.default = parsed.default.map(restoreToDo);

  toDoLists.projects = parsed.projects.map(proj => {
    const restoredProject = new Project(proj.title);
    restoredProject.id = proj.id;

    restoredProject.projectToDoList = proj.projectToDoList.map(restoreToDo);

    return restoredProject;
  });
}

export {toDoLists, Project, ToDoObject, loadFromStorage};
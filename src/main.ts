import { Extension } from "@codemirror/state";
import { EditorView, ViewPlugin } from "@codemirror/view";
import {
  App,
  editorViewField,
  EventRef,
  MarkdownView,
  parseFrontMatterStringArray,
  Plugin,
  TFile,
  WorkspaceLeaf,
} from "obsidian";

export default class CSSClassManagerPlugin extends Plugin {
  async onload() {
    this.registerEditorExtension(cssClassManagerPlugin(this));
  }
}

export function cssClassManagerPlugin(plugin: CSSClassManagerPlugin): Extension {
  return ViewPlugin.define(view => new CSSClassManagerExtension(view, plugin));
}

class CSSClassManagerExtension {
  markdownView: MarkdownView;
  app: App;
  file: TFile;
  leaf: WorkspaceLeaf;
  plugin: CSSClassManagerPlugin;
  cssClasses: string[];
  containerEl: HTMLElement;
  eventUninstaller: EventRef;

  constructor(view: EditorView, plugin: CSSClassManagerPlugin) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.markdownView = view.state.field(editorViewField);
    this.file = this.markdownView.file;
    this.leaf = this.markdownView.leaf;
    this.containerEl = view.dom.parentElement;

    if (this.file) {
      let classes = this.parseClasses();
      if (classes && classes.length > 0) {
        this.cssClasses = classes;
        this.addClasses(this.cssClasses);
      }
      this.eventUninstaller = this.app.metadataCache.on("changed", file => {
        if (file === this.file) {
          this.updateClasses();
        }
      });
    }
  }

  updateClasses() {
    let classes = this.parseClasses();
    if (classes) {
      this.removeClasses(this.cssClasses);
      this.cssClasses = classes;
      this.addClasses(classes);
    }
  }

  removeClasses(classes: string[]) {
    this.containerEl?.removeClasses(classes);
  }

  addClasses(classes: string[]) {
    this.containerEl?.addClasses(classes);
  }

  parseClasses() {
    return (this.frontmatter && parseFrontMatterStringArray(this.frontmatter, /^cssclass(es)?$/i, true)) || [];
  }

  get frontmatter(): any | null {
    let fileCache = this.app.metadataCache.getFileCache(this.file);
    return fileCache?.frontmatter;
  }

  update() {}

  destroy() {
    if (this.file && this.eventUninstaller) {
      this.app.metadataCache.offref(this.eventUninstaller);
    }
    if (this.cssClasses && this.cssClasses.length > 0) {
      this.removeClasses(this.cssClasses);
    }
  }
}

import 'obsidian'

declare module 'obsidian' {

  interface MarkdownPreviewView {
    rerender(full?: boolean): void;
  }
  interface App {
    viewRegistry: ViewRegistry;
    embedRegistry: EmbedRegistry;
  }
  interface ViewRegistry {
    typeByExtension: Record<string, string>;
    viewByType: Record<string, ViewCreator>;
    getTypeByExtension(ext: string): string | undefined;
    getViewCreatorByType(type: string): ViewCreator | undefined;
    isExtensionRegistered(ext: string): boolean;
    registerExtensions(exts: string[], type: string): void;
    registerViewWithExtensions(
      exts: string[],
      type: string,
      viewCreator: ViewCreator,
    ): void;
    unregisterExtensions(exts: string[]): void;
    unregisterView(viewType: string): void;
  }

  interface EmbedInfo {
    app: App;
    containerEl: HTMLDivElement;
    depth: number;
    displayMode: boolean;
    linktext: string;
    showInline: boolean;
    sourcePath: string;
  }
  interface EmbedCreator {
    (info: EmbedInfo, file: TFile, subpath: string): EmbedComponent;
  }
  interface EmbedRegistry {
    embedByExtension: Record<string, EmbedCreator>;
    registerExtension(ext: string, creator: EmbedCreator): void;
    registerExtensions(exts: string[], creator: EmbedCreator): void;
    unregisterExtensions(exts: string[]): void;
    unregisterExtension(ext: string): void;
  }
  interface EmbedComponent extends Component {
    loadFile(): any;
  }

  export class CustomCss extends Component {
    // Properties
    app: App
    boundRaw()
    csscache: Map<any, any>
    enabledSnippets: Set<any>
    extraStyleEls: HTMLStyleElement[]
    oldThemes: Theme[]
    queue: any
    requestLoadSnippets()
    requestLoadTheme()
    requestReadThemes()
    snippets: any[]
    styleEl: HTMLStyleElement
    theme: string
    themes: Record<string, Theme>
    updates: any
    _children: any[]
    _events: Function[]
    _loaded: boolean

    // Methods
    constructor(t)

    checkForUpdate(e)
    checkForUpdates()
    disableTranslucency()
    downloadLegacyTheme(e)
    enableTranslucency()
    getManifest(e)
    getSnippetPath(e)
    getSnippetsFolder()
    getThemeFolder()
    getThemePath(e)
    hasUpdates()
    installLegacyTheme(e)
    installTheme(e,t)
    isThemeInstalled(e)
    loadCss(e)
    loadData()
    loadSnippets()
    loadTheme(e)
    onRaw(e)
    onload()
    readSnippets(e)
    readThemes(e)
    removeTheme(e)
    // Sets the app theme
    setTheme(theme: string)
    setTranslucency(e)

    setCssEnabledStatus(snippetName: string, enabled: boolean): void
  }
  
  export type Theme = {
    author: string
    authorUrl: string
    dir: string
    fundingUrl: string
    minAppVersion: string
    name: string
    version: string
  }

  export interface App {
    account: any
    appId: string
    appMenuBarManager: any
    commands: any
    customCss: CustomCss
    dom: any
    dragManager: any
    embedRegistry: any
    fileManager: FileManager
    foldManager: any
    hotkeyManager: any
    internalPlugins: any
    isMobile: boolean
    keymap: Keymap
    /**
     * The last known user interaction event, to help commands find out what modifier keys are pressed.
     */
    lastEvent: UserEvent | null
    loadProgress: any
    metadataCache: MetadataCache
    mobileNavbar: any
    mobileToolbar: any
    nextFrameEvents: any
    nextFrameTimer: any
    plugins: any
    scope: Scope
    setting: any
    shareReceiver: any
    statusBar: any
    title: string
    vault: Vault
    viewRegistry: any
    workspace: Workspace

    
    // Methods:
    constructor(e,t)

    adaptToSystemTheme()
    changeTheme(e)
    copyObsidianUrl(e)
    disableCssTransition()
    emulateMobile(e)
    enableCssTransition()
    fixFileLinks(e)
    garbleText()
    getAccentColor()
    getAppTitle(e)
    getObsidianUrl(e)
    getTheme()
    importAttachments(e,t)
    initializeWithAdapter(t)
    loadLocalStorage(e)
    nextFrame(e)
    nextFrameOnceCallback(e)
    nextFramePromise()
    // The same as app.workspace.on
    on(e,t,n)
    onMouseEvent(e)
    onNextFrame(e)
    openHelp()
    openVaultChooser()
    openWithDefaultApp(e)
    registerCommands()
    registerQuitHook()
    saveAttachment(e,t,n)
    saveLocalStorage(e,t)
    setAccentColor(e)
    setAttachmentFolder(e)
    setTheme(e)
    showInFolder(e)
    showReleaseNotes(e)
    updateAccentColor()
    updateFontFamily()
    updateFontSize()
    updateInlineTitleDisplay()
    updateTheme()
    updateViewHeaderDisplay()
  }

  export interface Workspace {
    on(name: 'css-change', callback: () => any, ctx?: any): EventRef

    trigger(name: 'hover-link', data: {
      event: MouseEvent
      source: string
      hoverParent: Element
      targetEl: Element
      linktext: string
    })
  }

  export type Recycler = (a: unknown, b: unknown) => void

  export class MarkdownPreviewRenderer {
    static codeBlockPostProcessors: Record<string, MarkdownPostProcessor>
    static postProcessors: Array<MarkdownPostProcessor>
    static recyclers: Array<Recycler>

    static belongsToMe(e: unknown, t: unknown, n: unknown): boolean
    static registerCodeBlockPostProcessor(postProcessor: MarkdownPostProcessor, sortOrder?: number): void
    static registerDomEvents(t: unknown, n: unknown, i: unknown): void
    static registerRecycler(e: Recycler): void
    static unregisterRecycler(e: Recycler): void

    addFooter(): unknown
    addHeader(): unknown
    applyFoldInfo(e: unknown): unknown
    applyScroll(e: unknown, t: unknown): unknown
    applyScrollDelayed(e: unknown, t: unknown, n: unknown): unknown
    applyScrollSection(e: unknown): unknown
    belongsToMe(t: unknown): boolean
    cleanupParentComponents(): void
    clear(): void
    foldAllHeadings(): void
    foldAllLists(): void
    getFoldInfo(): unknown
    getInternalLinkHref(e: unknown): unknown
    getScroll(): unknown
    getSectionContainer(e: unknown): unknown
    getSectionForElement(e: unknown): unknown
    getSectionInfo(e: unknown): unknown
    getSectionTop(e: unknown): unknown
    handleDetached(e: unknown): unknown
    highlightEl(e: unknown): unknown
    measureSection(e: unknown): unknown
    onCheckboxClick(e: unknown, t: unknown): unknown
    onFootnoteLinkClick(e: unknown, t: unknown): unknown
    onHeadingCollapseClick(e: unknown, t: unknown): unknown
    onListCollapseClick(e: unknown, t: unknown): unknown
    onRender(): unknown
    onRendered(e: unknown): unknown
    onResize(): unknown
    onScroll(): unknown
    parseAsync(): unknown
    parseFinish(e: unknown, t: unknown): unknown
    parseSync(): unknown
    queueRender(): unknown
    removeFooter(): unknown
    removeHeader(): unknown
    renderHighlights(e: unknown, t: unknown): unknown
    rerender(e: unknown): unknown
    selectRange(e: unknown): unknown
    set(e: unknown): unknown
    setListCollapse(e: unknown, t: unknown): unknown
    showSection(e: unknown): unknown
    unfoldAllHeadings(): unknown
    unfoldAllLists(): unknown
    updateFooter(): unknown
    updateHeader(): unknown
    updateShownSections(): unknown
    updateVirtualDisplay(e: unknown): unknown
  }
}

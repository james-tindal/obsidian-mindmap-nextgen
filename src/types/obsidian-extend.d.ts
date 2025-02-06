import 'obsidian'

declare module 'obsidian' {

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
}

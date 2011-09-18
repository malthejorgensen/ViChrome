vichrome.Model = function() {
        // dependencies
    var NormalMode     = vichrome.mode.NormalMode,
        InsertMode     = vichrome.mode.InsertMode,
        SearchMode     = vichrome.mode.SearchMode,
        CommandMode    = vichrome.mode.CommandMode,
        FMode          = vichrome.mode.FMode,
        util           = vichrome.util,
        logger         = vichrome.log.logger,

        // private variables
        searcher       = null,
        pmRegister     = null,
        commandManager = null,
        curMode        = null,
        settings       = null;

    function changeMode(newMode) {
        logger.d("mode changed", newMode);
        if( curMode ) {
            curMode.exit();
        }
        curMode = newMode;
        curMode.enter();
    }

    this.init = function() {
        // should evaluate focused element on initialization.
        if( util.isEditable( document.activeElement ) ) {
            this.enterInsertMode();
        } else {
            this.enterNormalMode();
        }
        pmRegister     = new vichrome.register.PageMarkRegister();
        commandManager = new vichrome.command.CommandManager(this);
    };

    this.setPageMark = function(key) {
        var mark = {};
        mark.top = window.pageYOffset;
        mark.left = window.pageXOffset;

        pmRegister.set( mark, key );
    };

    this.goPageMark = function(key) {
        var offset = pmRegister.get( key );
        vichrome.view.scrollTo( offset.left, offset.top );
    };

    this.enterNormalMode = function() {
        changeMode( new NormalMode() );
    };

    this.enterInsertMode = function() {
        changeMode( new InsertMode() );
    };

    this.enterCommandMode = function() {
        changeMode( new CommandMode() );
    };

    this.enterSearchMode = function(backward) {
        var wrap = this.getSetting("wrapSearch");
        searcher = new vichrome.search.NormalSearcher( wrap, backward );

        changeMode( new SearchMode() );
        this.setPageMark();
    };

    this.enterFMode = function() {
        changeMode( new FMode() );
    };

    this.cancelSearch = function() {
        this.cancelSearchHighlight();
        this.goPageMark();
        this.enterNormalMode();
    };

    this.cancelSearchHighlight = function() {
        vichrome.view.setStatusLineText("");
        if( searcher ) {
            searcher.removeHighlight();
        }
    };

    this.setSearchInput = function() {
        this.enterNormalMode();
    };

    this.isInNormalMode = function() {
        return (curMode instanceof vichrome.mode.NormalMode);
    };

    this.isInInsertMode = function() {
        return (curMode instanceof vichrome.mode.InsertMode);
    };

    this.isInSearchMode = function() {
        return (curMode instanceof vichrome.mode.SearchMode);
    };

    this.isInCommandMode = function() {
        return (curMode instanceof vichrome.mode.CommandMode);
    };

    this.isInFMode = function() {
        return (curMode instanceof vichrome.mode.FMode);
    };

    this.goNextSearchResult = function(reverse) {
        this.setPageMark();
        return searcher.goNext( reverse );
    };

    this.getSetting = function(name) {
        return settings[name];
    };

    this.blur = function() {
        curMode.blur();
        this.enterNormalMode();
    };

    this.prePostKeyEvent = function(key, ctrl, alt, meta) {
        return curMode.prePostKeyEvent(key, ctrl, alt, meta);
    };

    this.isValidKeySeq = function(keySeq) {
        if( this.getKeyMapping()[keySeq] ) {
            return true;
        } else {
            return false;
        }
    };

    this.isValidKeySeqAvailable = function(keySeq) {
        // since escaping meta character for regexp is so complex that
        // using regexp to compare should cause bugs, using slice & comparison
        // with '==' may be a better & simple way.
        var keyMapping = this.getKeyMapping(),
            length     = keySeq.length,
            hasOwnPrp  = Object.prototype.hasOwnProperty,
            cmpStr, i;

        for ( i in keyMapping ) {
            if( hasOwnPrp.call( keyMapping, i ) ) {
                cmpStr = i.slice( 0, length );
                if( keySeq === cmpStr ) {
                    return true;
                }
            }
        }

        return false;
    };

    this.handleKey = function(msg) {
        return commandManager.handleKey(msg);
    };

    this.triggerCommand = function(method) {
        if( curMode[method] ) {
            curMode[method]();
        } else {
            logger.e("INVALID command!:", method);
        }
    };

    this.onSettingUpdated = function(msg) {
        if(msg.name === "all") {
            settings = msg.value;
        } else {
            settings[msg.name] = msg.value;
        }
    };

    this.onFocus = function(target) {
        if(this.isInCommandMode() || this.isInSearchMode()) {
            return;
        }

        if( util.isEditable( target ) ) {
            this.enterInsertMode();
        } else {
            this.enterNormalMode();
        }
    };

    this.getKeyMapping = function() {
        return curMode.getKeyMapping();
    };
};

function EFText(element, level) {
    EFSlideElement.call(this, element, level);
    if(element.linkedFile){
        this.linkedFile = element.linkedFile;
    }
    this.$textDiv = null;
    this.$editor = null;
    this.$shiftY = 48;
    this.$resizeHeight = 48;
    this.$top = 0;
}

EFText.prototype = Object.create(EFSlideElement.prototype);

EFText.prototype.constructor = EFText;


EFText.prototype.getDefaultObject = function(slideLayerId, frame){
    var object = EFSlideElement.prototype.getDefaultObject.call(this, slideLayerId);
    object.entity_type = 'EFText';
    object.text = i18n('slide.element.addtext');
    object.fontSize = 15;
    object.fontName = 'Arial';
    object.colorRed = 0;
    object.colorGreen = 0;
    object.colorBlue = 0;
    object.textAlign = 0;
    object.isLink = false;
    object.isInfoText = false;
    if(frame){
        object.frame = frame;
    }else{
        object.frame = '{{362, 235}, {300, 230}}';
    }
    return object;
};

EFText.prototype.update = function(element) {
    EFSlideElement.prototype.update.call(this, element);
    this.text = element.text;
    this.fontSize = element.fontSize;
    this.fontName = element.fontName;
    this.colorRed = element.colorRed;
    this.colorGreen = element.colorGreen;
    this.colorBlue = element.colorBlue;
    this.textAlign = element.textAlign;
    this.isLink = element.isLink;
    this.isInfoText = element.isInfoText;
};

EFText.prototype.draw = function(view) {
    EFSlideElement.prototype.draw.call(this, view);
    this.$elementDiv.empty();

    // draw text display
    // apply nl2br only
    var txt;
    if (this.text.substring(0, 2) === '<p' && this.text.slice(-4) === '</p>') {
        txt = this.text;
    } else {
        txt = nl2br(this.text, false);
    }

    this.$textDiv = $("<div id='textDiv-" + this.id + "' class='slide-element-text'>"+txt+"</div>");

    this.$textDiv.css("font-size", this.fontSize+"px");
    this.$textDiv.css("font-family", this.fontName);
    this.$textDiv.css("color", "rgb("+this.colorRed+", "+this.colorGreen+", "+this.colorBlue+")");

    if (this.textAlign === 0) {
        this.$elementDiv.css("text-align", "left");
    } else if (this.textAlign == 1) {
        this.$elementDiv.css("text-align", "center");
    } else if (this.textAlign == 2) {
        this.$elementDiv.css("text-align", "right");
    }
    this.$elementDiv.append(this.$textDiv);

    this.calculateAndSetTextTop();

    this.drawHeader();
};

EFText.prototype.drawHeader = function() {
    if (parseInt(this.isLink)) {
        this.$elementHeader.append(" <img src='./media/images/external.gif' />");
    }
    if (parseInt(this.isInfoText)) {
        this.$elementHeader.append(" <img src='./media/images/comment-left.gif' />");
    }

    EFSlideElement.prototype.drawHeader.call(this);
};

EFText.prototype.showSettingsForm = function() {
    EFSlideElement.prototype.showSettingsForm.call(this);

    var self = this;
    // empty settings form

    // text (hidden)
    this.$settingsForm.append("<input type='hidden' name='text' value='"+this.text+"' />");

    // info text
    var infoChecked = (self.isInfoText == 1) ? "checked='checked'":"";
    var infoTextCheckbox = $("<label class='separationSpace' for='isInfoText'><input id='isInfoText' type='checkbox' name='isInfoText' value='"+self.isInfoText+"' "+infoChecked+" onclick='$(this).val(this.checked ? 1 : 0)'/>"+i18n("text.info")+"</label><br/>");
    $('#settingsFrame').append(infoTextCheckbox);

    // is link
    var slideId = $("<input type='hidden' name='slideId' value='"+currentSlide.id+"'>");
    var action = self.original.action;
    var typeOfLink = 0;
    var openExternal = 0;
    var externalUrl = "";
    var idOfInternal = "";
    var fullInternal = "";
    if (action && action !== "") {
        var typeOfAction = action.split(":",1);
        if (typeOfAction == "internal") {
            typeOfLink = 2;
            if (action.substr(action.indexOf("/")+2) !== "") fullInternal = action.substr(action.indexOf("/")+2).split("/");
            var typeOfInternal = fullInternal[0];
            if (typeOfInternal == "EFFile") typeOfLink = 3;

            if (fullInternal[1].indexOf("?") != -1) {
                openExternal = 1;
                idOfInternal = fullInternal[1].substr(0,fullInternal[1].indexOf("?"));
            } else {
                idOfInternal = fullInternal[1];
            }
        } else  {
            typeOfLink = 1;
            externalUrl = action.substr(action.indexOf("/")+2);
        }
    }

    var linkSelect = $("<select id='typeLinkSelect' name='isLink'></select>");
    var typeItems = [i18n('no.link'), i18n('external.link'), i18n('internal.link'), i18n('file.link')];
    var elementSelected = "";
    for (i = 0; i < 4; i++) {
        elementSelected = (i == typeOfLink) ? "selected='selected'":"";
        linkSelect.append("<option value='"+i+"' "+elementSelected+">"+typeItems[i]+"</option><br />");
    }
    $('#settingsFrame').append("<label class='separationSpace'>"+i18n("text.link")+"</label><br/>").append(linkSelect);
    $('#settingsFrame').append(slideId);

    //External link :: Web
    var externalDisplay = (typeOfLink == 1) ? "":"style='display: none;'";
    $('#settingsFrame').append("<input id='externalLink' type='text' name='externalLink' value='"+externalUrl+"' placeholder='"+i18n('external.link.placeholder')+"' "+externalDisplay+" autocomplete='off'/><br /> ");

    //Internal link :: SlideId
    var internalDisplay = (typeOfLink == 2) ? "":"style='display: none;'";
    var slideContainerDiv = $("<div id='slideContainer'"+internalDisplay+"></div>");
    $('#settingsFrame').append(slideContainerDiv);


    //File link :: FileId
    var fileDisplay = (typeOfLink == 3) ? "":" style='display: none;'";
    var fileContainerDiv = $("<div id='fileContainer' onclick='selectLinkedFile(\"file\")' "+fileDisplay+"></div>");
    $('#settingsFrame').append(fileContainerDiv);

    if(typeOfLink == 3 && idOfInternal){
        if(!this.linkedFile){
            $.ajax({
                url: "./php/ajax/files/get_file_by_id.php",
                data: "fileId="+idOfInternal,
                type: "GET",
                dataType: "json",
                success: function(file) {
                    // image select
                    self.updateLinkedFile(file);
                    showSelectedFileInSetting($("#fileContainer"), file);
                }
            });
        }else{
            showSelectedFileInSetting($("#fileContainer"), this.linkedFile);
        }
    }else{
        showSelectedFileInSetting($("#fileContainer"), null);
    }

    //Open in external application :: Open external
    var viewerChecked = (openExternal == 1) ? "checked='checked'":"";
    var viewerExternal = $("<label class='viewerExternal' for='viewerExternalCheckbox' "+fileDisplay+"><input id='viewerExternalCheckbox' class='viewerExternal' type='checkbox' name='viewerExternal'  value='"+openExternal+"' "+fileDisplay+" "+viewerChecked+" onclick='$(this).val(this.checked ? 1 : 0)'/>"+i18n("open.external")+"</label><br/>");
    this.$settingsForm.append(viewerExternal);

    $('#typeLinkSelect option:eq('+typeOfLink+')').attr('selected', 'selected');

    // RGB
    this.$settingsForm.append("<input class='small-input' type='hidden' name='colorRed' value='"+this.colorRed+"' placeholder='"+i18n("color.red")+"' /><input class='small-input' type='hidden' name='colorGreen' value='"+this.colorGreen+"' placeholder='"+i18n("color.green")+"' /><input class='small-input' type='hidden' name='colorBlue' value='"+this.colorBlue+"' placeholder='"+i18n("color.blue")+"' />");

    this.finishSettingsForm();
    loadSlidesSelect(idOfInternal);
};

EFText.prototype.updateLinkedFileId = function(fileId) {
    EFSlideElement.prototype.updateLinkedFileId.call(this, fileId);
};

EFText.prototype.finishSettingsForm = function() {
    EFSlideElement.prototype.finishSettingsForm.call(this);
};

EFText.prototype.setText = function(textString) {
    this.updateSaveState(true);
    this.text = textString;
    this.$textDiv[0].innerText = textString;
};

//TODO: this function does not seem to have any purpose even though its been called a lot
EFText.prototype.calculateAndSetTextTop = function() {
    if (this.$textDiv) {
        this.$top = Math.max(0, Math.round((this.getHeight() / 2) - (this.$textDiv.height() / 2)));
        this.$textDiv.css("top", this.$top);
    }
};

EFText.prototype.updateTextInputSizeAndPosition = function() {
};

EFText.prototype.updateFontFamily = function(fontName) {
    this.$textDiv.css("fontFamily", fontName);
    this.fontName = fontName;
    if (this.$editor) {
        this.$editor.dom.setStyle(this.$editor.getBody(), "font-family", fontName);
    }
};

EFText.prototype.updateFontSize = function(fontSize) {
    this.updateSaveState(true);
    this.$textDiv.css("fontSize", fontSize + "px");
    this.fontSize = fontSize;
    this.calculateAndSetTextTop();
    this.updateTextInputSizeAndPosition();

    if (this.$editor) {
        this.$editor.dom.setStyle(this.$editor.getBody(), "font-size", fontSize + "px");
    }
};

EFText.prototype.updateTextAlign = function(textAlign) {
    this.updateSaveState(true);
    this.$textDiv.css("textAlign", textAligns[textAlign]);
    this.textAlign = textAlign;

    if (this.$editor) {
        this.$editor.dom.setStyle(this.$editor.getBody(), "text-align", textAligns[textAlign]);
    }
};

EFText.prototype.updateLinkedFile = function(file) {
    this.linkedFile = JSON.parse(angular.toJson(file));
};

EFText.prototype.updatePosition = function() {
    EFSlideElement.prototype.updatePosition.call(this);

    this.updateTextInputSizeAndPosition();
    this.calculateAndSetTextTop();
    this.updateSaveState(true);
};

EFText.prototype.setHeight = function (newHeight) {
    EFSlideElement.prototype.setHeight.call(this, newHeight);
    if (this.isInEditingMode()) {
        var elem = tinymce.DOM.get('textDiv-' + this.id + '_ifr');
        if (elem !== null) {
            tinymce.DOM.setStyle(elem, 'height', newHeight + 'px');
        }
        $('div.tox.tox-tinymce').css('height', newHeight + 'px');

        this.calculateEditorHeight(newHeight);
    }
};

EFText.prototype.calculateEditorHeight = function(newHeight) {
    var body = this.$editor.getBody();
    this.$top = Math.max(0, Math.round((newHeight / 2) - (body.offsetHeight / 2)));
    this.$editor.dom.setStyle(body, "top", this.$top);
};

EFText.prototype.enterEditingMode = function() {
    EFSlideElement.prototype.enterEditingMode.call(this);

    if (this.getY() > Math.abs(this.$shiftY)) {
        this.$shiftY = this.$resizeHeight;
    } else {
        this.$shiftY = 0;
    }

    var obj = this;
    var editDivID = 'div#textDiv-' + this.id;
    //var editDivID = 'div[elementid=' + this.id + ']';

    tinymce.init({
        selector: editDivID,
        inline: true,
        fixed_toolbar_container: '#optionsFrame label',
        //inline: false,
        resize: false,
        height: parseFloat(this.getHeight()),
        plugins: 'textcolor paste colorpicker',
        paste_strip_class_attributes : "mso",
        paste_remove_spans : false,
        paste_convert_word_fake_lists: false,
        statusbar: false,
        //toolbar: ['formatting | undo redo | forecolor backcolor | bold italic underline | fontselect fontsizeselect | alignleft aligncenter alignright alignjustify'],
        //toolbar: ['undo redo forecolor backcolor bold italic underline fontselect fontsizeselect  alignleft aligncenter alignright alignjustify'],
        toolbar1: 'undo | redo ',
        toolbar2: 'forecolor backcolor',
        toolbar3: 'bold | italic | underline',
        toolbar4: 'fontselect  fontsizeselect',
        toolbar5: 'alignleft | aligncenter | alignright | alignjustify',

        font_formats: 'Arial=Arial;Arial Rounded MT Bold=Arial Rounded MT Bold;Helvetica=Helvetica;Montserrat-Regular=Montserrat-Regular;Helvetica-Oblique=Helvetica-Oblique',
        fontsize_formats: "8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 30pt 36pt 45pt",
        content_style: 'p {margin: 0px} .mce-content-body {overflow: hidden}',
        setup: function(ed) {
            ed.on('change', function(e) {
                var content = ed.getContent();
                $("input[name=text]").val(content);
                obj.text = content;
                setPresentationUpdated(true);
                obj.calculateEditorHeight(obj.getHeight());
            });
        },
        init_instance_callback : function(editor) {
            obj.$editor = editor;
            var body = editor.getBody();

            editor.dom.setStyle(body, "top", obj.$top);
            editor.dom.setStyle(body, "position", "relative");
            editor.dom.setStyle(body, "margin", "0");

            // rgb left for backwards compatibility with old format slides
            editor.dom.setStyle(body, "color", "rgb(" + obj.colorRed + ", " + obj.colorGreen +
                ", " + obj.colorBlue + ")");

            editor.dom.setStyle(body, "font-size", obj.fontSize + "px");
            editor.dom.setStyle(body, "font-family", obj.fontName);
            if (obj.textAlign === 0) {
                editor.dom.setStyle(body, "text-align", "left");
            } else if (obj.textAlign == 1) {
                editor.dom.setStyle(body, "text-align", "center");
            } else if (obj.textAlign == 2) {
                editor.dom.setStyle(body, "text-align", "right");
            }
        },
        menubar: false
    });
};

EFText.prototype.leaveEditingMode = function(createThumbnail = true) {
    if (this.$editor !== null) {
        tinymce.remove('div#textDiv-' + this.id);
        // this.setHeight(parseFloat(this.getHeight()) - this.$resizeHeight);
        // this.setY(parseFloat(this.getY()) + this.$shiftY);
        this.$editor = null;
        EFSlideElement.prototype.leaveEditingMode.call(this, createThumbnail);
    }
};

EFText.prototype.saveElementInPresentationJson = function(){

    for(var i = 0; i < currentPresentation.Slides[getCurrentSlideIndex(currentPresentation.Slides, currentSlide)].Layers[this.level].Elements.length; i++){
        var element = currentPresentation.Slides[getCurrentSlideIndex(currentPresentation.Slides, currentSlide)].Layers[this.level].Elements[i];
        if(element.entity_type == 'EFCurtain'){

            if(element.Text.id == this.id){
                EFCurtain.prototype.updateText(this.level, this.getEFTextWithUpdatedAttributes(element.Text));
            }else if(element.Headline.id == this.id){
                EFCurtain.prototype.updateHeadline(this.level, this.getEFTextWithUpdatedAttributes(element.Headline));
            }
        }
        if(currentPresentation.Slides[getCurrentSlideIndex(currentPresentation.Slides, currentSlide)].Layers[this.level].Elements[i].id == this.id){
            var currentElement = this.getEFTextWithUpdatedAttributes(currentPresentation.Slides[getCurrentSlideIndex(currentPresentation.Slides, currentSlide)].Layers[this.level].Elements[i]);
            currentPresentation.Slides[getCurrentSlideIndex(currentPresentation.Slides, currentSlide)].Layers[this.level].Elements[i] = currentElement;
        }
    }
};

EFText.prototype.getEFTextWithUpdatedAttributes = function(element){
    element.frame = EFSlideElement.prototype.getFrame.call(this);
    element.text = this.text;
    element.fontSize = this.fontSize;
    element.fontName = this.fontName;
    element.colorRed = this.colorRed;
    element.colorGreen = this.colorGreen;
    element.colorBlue = this.colorBlue;
    element.textAlign = this.textAlign;

    element.isInfoText = this.isInfoText;
    var action = EFSlideElement.prototype.getLinkAttribute($('select#typeLinkSelect').val());
    if(action !== ""){
        element.isLink = true;
        element.action = action;
        if(element.action.indexOf('EFFile') > -1){
            element.linkedFile = this.linkedFile;
        }
    }else{
        element.isLink = false;
    }
    return element;
};

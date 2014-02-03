(function() {
    var clone = fabric.util.object.clone;

    var stateProperties = fabric.Object.prototype.stateProperties.concat();
    stateProperties.push(
        'originalText',
        'valign'
    );

    fabric.TextBox = fabric.util.createClass(fabric.IText, fabric.Observable, /** @lends fabric.IText.prototype */ {
        /**
         * Type of an object
         * @type String
         * @default
         */
        type: 'textbox',

        /**
         * The text that was setted when the object was instantiated
         * @type String
         * @default
         */
         originalText: '',

        /**
         * The padding of the text, relative to the "box"
         * @type Integer
         * @default
         */
        textPadding: 0,

        /**
         * Defines if the textPadding must be scaled with the box
         * @type Boolean
         * @default
         */
        scaleTextPadding: true,

        /**
         * Vertical alignment of the text relative to the box. Possible values: top, center, bottom
         * @type String
         * @default
         */
        vAlign: 'center',

        /**
         * Original scales of the box. Used when rendering the text
         * @private
         * @type Array
         */
        originalScales: null,

        /**
         * The scaleX property that needed to be applied to the box
         * @type Integer
         * @default
         */
        boxImageScaleX: 1,

        /**
         * The scaleY property that needed to be applied to the box
         * @type Integer
         * @default
         */
        boxImageScaleY: 1,

        /**
         * The fabric.Text object that holds the text
         * @type fabric.Text
         */
        //textObject: null,

        /**
         * Color of object's fill
         * @type String
         * @default
         */
        fill: "rgba(221,204,197,0.6)",


        /**
         * Constructor
         * @param {String} text Text string
         * @param {Object} [options] Options object
         * @return {fabric.IText} thisArg
         */
        initialize: function(text, options) {
            this.callSuper('initialize', text, options);
            this.initBehavior();

            //this.textObject = new fabric.IText(text, options);
            this.originalText = text;

            fabric.TextBox.instances.push(this);
        },

        /**
         * Calculate and return the textScale, based on the scaling of the object
         * @method getTextPadding
         * @param {String} scale The type of the scale. Possible values are "y" and "x"
         * @return Number
         */
        getTextPadding: function(scale) {
            if (!scale) scale = "x";
            else scale = scale.toLowerCase();

            if (!this.scaleTextPadding) {
                return this.textPadding;
            } else {
                var scales = {}, originalScales = this.originalScales;
                if (originalScales) {
                    scales.x = originalScales[0];
                    scales.y = originalScales[1];
                } else {
                    scales.x = this.get("scaleX");
                    scales.y = this.get("scaleY");
                }
                return this.textPadding * scales[scale];
            }
        },

        /**
         * Copied from fabric.Object.render, but with little modifications
         * @method render
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {Boolean} noTransform
         */
        _render: function(ctx, noTransform) {
            this.callSuper('_render', ctx);
return;
            //if (this.Textarea) {
                ctx.save();
                this._preRenderTransform(ctx, noTransform, true);

                this._applyPropertiesToText();
                // move and render text
                this._moveText(ctx);
                this.callSuper('_render', ctx);
                //this.render(ctx, true);
                if (!noTransform) {
                    this.scaleX = this.originalScales[0];
                    this.scaleY = this.originalScales[1];
                    this.originalScales = null;
                }
                ctx.restore();
            //}
        },

        /**
         * Transforms context before to render an object
         * @method _preRenderTransform
         * @param {CanvasRenderingContext2D} ctx Context
         * @param {Boolean} noTransform If transform shouldn't be applyed
         * @param {Boolean} noScale True if scale(x|y) must be reseted to 1, false if not
         */
        _preRenderTransform: function(ctx, noTransform, noScale) {
            var m = this.transformMatrix;
            if (m && !this.group) {
                ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }

            if (!noTransform) {
                if (noScale) {
                    this.originalScales = [this.scaleX, this.scaleY];
                    this.scaleX = 1;
                    this.scaleY = 1;
                }

                this.transform(ctx);
            }

            if (m && this.group) {
                ctx.translate(-this.group.width/2, -this.group.height/2);
                ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }
        },

        /**
         * Apply the text properties to the fabric.Text object
         * @method _applyPropertiesToText
         * @param {Array} Properties
         * @return {Array} Options applied to text object
         */
        _applyPropertiesToText: function(options) {
            var text_opts = {};
            if (options) {
                text_opts = fabric.util.object.clone(options);
            } else {
                for (var i = 0; i < stateProperties.length; i++) {
                    text_opts[stateProperties[i]] = this.get(stateProperties[i]);
                }
            }
            // locks the text object
            text_opts.lockScalingX = true;
            text_opts.lockScalingY = true;
            text_opts.selectable = false;
            text_opts.scaleX = 1;
            text_opts.scaleY = 1;
            text_opts.text = this.originalText;

            //if (this.hiddenTextarea)
              //  this.hiddenTextarea.setOptions(text_opts);
            return text_opts;
        },

        /**
         * Adjust the text position in the canvas
         * @method _moveText
         * @param {CanvasRenderingContext2D} ctx Context to render on
         */
        _moveText: function(ctx) {
            this.set('text', this._wrapText(ctx, this.get('originalText')));

            var scaleX = this.originalScales ? this.originalScales[0] : this.scaleX;
            var scaleY = this.originalScales ? this.originalScales[1] : this.scaleY;
            var x = 0, y = 0;

            // horizontal alignment
            if (this.textAlign == 'left') {
                x = x - ((this.get("width") * scaleX) / 2) + (this.get('width') / 2) + (this.getTextPadding('x'));
            } else if (this.textAlign == 'right') {
                x = x + ((this.get("width") * scaleX) / 2) - (this.get('width') / 2) - (this.getTextPadding('x'));
            }

            // vertical alignment
            if (this.vAlign == "top") {
                y = y + ((this.get('height') / 2)
                    - ((this.get('height')*scaleY)/2)
                    ) + (this.getTextPadding('y'));
            } else if (this.vAlign == 'bottom') {
                y = y - ((this.get('height') / 2)
                    - ((this.get('height')*scaleY)/2)
                    ) - (this.getTextPadding('y'));
            }

            // left and top are related to current context transform (the transform of textbox object)
            this.set("left", x);
            this.set("top", y);
        },

        /**
         * Break the text accordingly to the width of Textbox. Based on the code of Darren Nolan (@darrennolan)
         * @method _wrapText
         * @param {CanvasRenderingContext2D} ctx Context to render on
         * @param {String} Text to wrap
         * @return {Array} Array with the lines of the text
         */
        _wrapText: function (ctx, text) {
            var scaleX = (this.originalScales ? this.originalScales[0] : this.scaleX);
            var maxWidth = (this.width * scaleX),
                lines = text.split("\n"),
                wrapped_text = [];

            var maximum=0;

            // pass the text properties to the canvas context
            this._setTextStyles(ctx);

            for (var l = 0; l < lines.length; l++) {
                var line = "";
                var words = lines[l].split(" ");
                for (var w = 0; w < words.length; w++) {
                    var testLine = line + words[w] + " ";
                    var metrics = ctx.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > (maxWidth - (this.getTextPadding('x') * 2))) {
                        wrapped_text.push(line);
                        line = words[w] + " ";
                    } else {
                        line = testLine;
                        maximum = Math.max(testWidth, maximum);
                    }
                }
                wrapped_text.push(line);
            }

            return wrapped_text.join("\n");
        }
    });

    /**
     * Returns fabric.IText instance from an object representation
     * @static
     * @memberOf fabric.IText
     * @param {Object} object Object to create an instance from
     * @return {fabric.IText} instance of fabric.IText
     */
    fabric.TextBox.fromObject = function(object) {
        return new fabric.TextText(object.text, clone(object));
    };

    /**
     * Contains all fabric.ITextBox objects that have been created
     * @static
     * @memberof fabric.ITextBox
     * @type Array
     */
    fabric.TextBox.instances = [ ];
})();



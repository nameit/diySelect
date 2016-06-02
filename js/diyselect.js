/**
 * 模拟下拉菜单
 * @ {string}  selectClass 下拉菜单的样式名
 * @ {string}  optionClass 下拉菜单下拉部分的样式名
 * @ {string}  valueAttr   模拟option部分的属性
 * @ {number}  zIndex      下拉菜单的层级
 * @ {number}  maxSize     下拉菜单最多显示的个数，超过则显示滚动条
 * @ {string}  eventType   下拉菜触发事件
 * @ {string}  checkText   初始选中值
 *
 */
var DiySelect = function (select, options) {
    options = $.extend({}, $.fn.diySelect.defaults, options);

    this.options = options;
    this.hasInit = false;

    this.init(select);
};


DiySelect.prototype = {

    constructor: DiySelect,

    init: function (select) {
        // 是否初始化且目标元素是否为 `select`
        if (this.hasInit && select.tagName.toLowerCase !== 'select') {
            return;
        }

        var id = select.id;

        this.selectSpan = $('<span/>').addClass(this.options.selectClass).attr('id', id + '-select');
        this.optionDiv = $('<div/>').addClass(this.options.optionClass).attr('id', id + '-option');

        this.optionDiv.hide();

        if(this.options.isSearch)
        {
            this.optionUl = $('<ul style="max-height:120px;overflow:auto;"></ul>');
        }else{
            this.optionUl = $('<ul/>');
        }
        this.option = $(select).find('option');
        this.optionSize = this.option.length;
        this.bgIframe = $('<iframe/>').addClass('bgiframe').attr('frameborder', '0');

        // 组装模拟元件
        this.setupOption();
        this.setupSelect();

        // DOM 操作：
        // 隐藏原 `select`，再其后加入模拟的 `HTMLElement`
        $(select).hide();
        this.selectSpan.insertAfter($(select));
        this.optionDiv.insertAfter(this.selectSpan).hide();

        // 初始化完成标记
        this.hasInit = true;

        var that = this;
        var active = -1;
        var list = this.optionDiv.find('li');
        var timer;

        // 事件绑定
        list.on('click', function (e) {
            var text = $(this).text();

            if(!that.options.link) {
                e.preventDefault();
                e.stopPropagation();
            }

            that.chooseOption(text);
            $(select).trigger('change');
        });

        list.on('mouseenter', function () {
            list.removeClass('active');
            $(this).addClass('active');
            active = list.filter(':visible').index(this);
        });

        if (that.options.eventType === 'hover') {
            this.selectSpan.on('mouseenter', function (e) {
                e.preventDefault();
                e.stopPropagation();

                // 自定义事件
                if (that.options.beforeSelect) {
                    that.options.beforeSelect.apply(this);
                }

                $('.' + that.options.optionClass).hide();

                // if (that.optionVisible) {
                 // that.hideOption();
                // } else {
                 // that.showOption();
                // }
                // that.showOption();

                if (timer) {
                    clearTimeout(timer);
                }

                that.showOption();
            });

            this.selectSpan.on('mouseleave', function (e) {
                timer = setTimeout(function() {
                    that.hideOption();
                }, 200);
            });

            list.on('mouseenter', function () {
                if (timer) {
                    clearTimeout(timer);
                }
            });

            list.on('mouseleave', function () {
                timer = setTimeout(function() {
                    that.hideOption();
                }, 200);
            });
        } else {
            this.selectSpan.on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                // 自定义事件
                if (that.options.beforeSelect) {
                    that.options.beforeSelect.apply(this);
                }

                $('.' + that.options.optionClass).hide();

                if (that.optionVisible) {
                 that.hideOption();
                } else {
                 that.showOption();
                }
                that.showOption();
            });
        }

        $(select).on('choose', function (e, text) {
            e.stopPropagation();
            that.chooseOption(text);
        });

        $(select).on('revert', function (e) {
            e.stopPropagation();
            that.revert();
        });

        // 窗口变化时调整位置
        $(window).on('resize', $.proxy(this.setPosition, this));

        // 模拟 `select` 失焦
        $(document).on('click', function (e) {
            if (that.optionVisible) {
                if(e.target == that.optionUl.siblings('.searchDiv').find('input')[0] || e.target == that.optionUl.siblings('.searchDiv')[0] || e.target == that.optionUl.siblings('.searchDiv').find('.search_btn')[0])
                {
                    return;
                }else{
                    that.hideOption();
                }
             }
        });

        // 键盘事件
        $(document).on('keydown', function (e) {
            if (that.optionDiv.is(':visible')) {
                switch (e.keyCode) {
                    case 13: // enter
                        if (active !== -1) {
                            var text = list.slice(active, active + 1).text();
                            that.chooseOption(text);
                        }

                        that.hideOption();
                        $(select).trigger('change');
                        break;
                    case 27: // esc
                        that.hideOption();
                        break;
                    case 38: // up
                        e.preventDefault();
                        moveSelect(-1);
                        break;
                    case 40: // down
                        e.preventDefault();
                        moveSelect(1);
                        break;
                }
            }
        });

        /**
         * 焦点位移
         * @param  {float} step 位移步长
         */
        function moveSelect(step) {
            var count = list.length;

            active += step;

            if (active < 0) {
                active =  0;
            } else if (active >= count) {
                active = count - 1;
            } else {
                list.removeClass('active');
                list.slice(active, active + 1).addClass('active');

                // 出现滚动条的情况
                if ( active >= (that.options.maxSize / 2) && count > that.options.maxSize) {
                    that.optionDiv.scrollTop(list.height() * (active - (that.options.maxSize / 2)));
                }
            }
        }
    },

    setupOption: function () {
        var fragment = document.createDocumentFragment();

        for (var i = 0; i < this.optionSize; i++) {
            var text = this.option[i].text;
            var href = $(this.option[i]).data('href');
            var li = document.createElement('li');
            var value = this.option[i].value;

            if(this.options.link) {
                var a = document.createElement('a');
                a.innerHTML = text;
                a.href = href;
                a.target = '_blank';
                li.appendChild(a);
                fragment.appendChild(li);
                if (value) {
                    a.setAttribute('data-' + this.options.valueAttr, value);
                }
            }
            else {
                li.innerHTML = text;
                fragment.appendChild(li);
                if (value) {
                    li.setAttribute('data-' + this.options.valueAttr, value);
                }
            }


        }
        if(this.options.isSearch)
        {
            this.optionDiv.append('<div class="searchDiv" id="'+this.options.searchId+'" style="margin:10px 0;"><input style="width:60%" class="input searchBranch"><input class="search_btn right_btn"></div>');
        }

        this.optionDiv.append(this.optionUl);
        this.optionUl.get(0).appendChild(fragment);
        this.optionVisible = false;
    },

    setupSelect: function () {
        var checkText = this.options.checkText || this.option.filter(':selected').text();

        // 初始选择（可设置）
        this.chooseOption(checkText);

        if (this.options.width) {
            this.selectSpan.width(this.options.width);
        }

        var spanStyle = this.selectSpan.attr('style');

        if (spanStyle) {
            spanStyle += ';' + this.options.style;
        }

        this.selectSpan.attr('style', spanStyle);
    },

    setPosition: function () {
        // 可视窗口顶部到 `selectSpan` 的距离
        var top_height = this.selectSpan.offset().top + this.selectSpan.outerHeight() - $(window).scrollTop();

        // 可视窗口剩余空间与 `optionDiv` 高度的差值
        var diff = $(window).height() - top_height - this.optionDiv.height();

        // 差值大于零，说明剩余空间还可容纳 `optionDiv`
        // `optionDiv` 就位居 `selectSpan` 正下方展示
        // 反之亦然
        if ( diff > 0 ) {
            if(this.options.isSearch)
            {
                this.optionDiv.pin({
                    base: this.selectSpan,
                    baseXY: [0, '100%-3px']
                });
                this.optionDiv.css({'borderColor':'#f99f42','borderTop':'0 none','borderBottom':'1px solid #f99f42'});
            }
            else{
                 this.optionDiv.pin({
                    base: this.selectSpan,
                    baseXY: [0, '100%-1px']
                });
            }
        } else {
             if(this.options.isSearch)
            {
                this.optionDiv.pin({
                    base: this.selectSpan,
                    selfXY: [0, '100%-3px']
                });
                this.optionDiv.css({'borderColor':'#f99f42','borderBottom':'0 none','borderTop':'1px solid #f99f42'});
            }
            else{
                 this.optionDiv.pin({
                    base: this.selectSpan,
                    selfXY: [0, '100%-1px']
                });
            }
        }
    },

    chooseOption: function(text) {
        this.hideOption();
        this.selectSpan.html(text);
        // this.option.attr('selected', false);

        for (var i = 0; i < this.optionSize; i++) {
            if (text === this.option[i].text) {
                // 原生 `select` 跟随选择
                this.option[i].selected = true;
                break;
            }
        }

        if (this.options.afterChoose) {
            this.options.afterChoose.apply(this, [text]);
        }
    },

    isIE: function (ver) {
        var b = document.createElement('b');
        b.innerHTML = '<!--[if IE ' + ver + ']><i></i><![endif]-->';
        return b.getElementsByTagName('i').length === 1;
    },

    showOption: function () {
        var that = this;
        this.optionDiv.show();

        this.optionDiv.height(Math.min(this.optionDiv.height(),(this.optionDiv.find('li').outerHeight(true) * this.options.maxSize))+'px');

        this.optionDiv.css({
            'min-width': this.selectSpan.outerWidth(true),
            'z-index': this.options.zIndex
        });

        if (this.isIE(6)) {
            this.optionDiv.css('zoom', 1);
        }
        if(this.options.isSearch)
        {
            this.selectSpan.css({'borderColor':'#f99f42'});
        }
        this.setPosition();
        this.optionVisible = true;
    },

    hideOption: function () {
        this.optionDiv.hide();
        this.optionVisible = false;
    },


    revert: function () {
        this.selectSpan.remove();
        this.optionDiv.remove();
    }
};

// 注册插件
$.fn.diySelect = function (options) {
    return this.each(function () {
        new DiySelect(this, options);
    });
};

$.fn.chooseSelect = function (value) {
    return this.trigger('choose', [value]);
};

$.fn.revertSelect = function () {
    return this.trigger('revert');
};

// 默认设置
$.fn.diySelect.defaults = {
    selectClass: 'js-select',
    optionClass: 'js-option',
    arrowClass: 'arrow',
    valueAttr: 'select-val',
    zIndex: '10000',
    offsetY: 1,
    maxSize: 5,
    eventType: 'click'
};

$.fn.Constructor = DiySelect;

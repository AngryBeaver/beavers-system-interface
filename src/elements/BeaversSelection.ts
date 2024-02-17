import {Settings} from "../Settings.js";

export class BeaversSelection extends HTMLElement {
    choices = {};
    removeOutsideClick: () => void;
    selected: string | undefined;
    dropDown: JQuery;
    oninput: ((this:GlobalEventHandlers, ev: Event) => any) | null;
    onchange: ((this:GlobalEventHandlers, ev: Event) => any) | null;

    constructor() {
        super();
        const self = this;
        $(this).find('option').each(function () {
            const id = this.getAttribute('value');
            const text = this.innerText;
            const img = this.getAttribute('img');
            if (id) {
                self.choices[id] = {text: text, img: img}
            }
        });
        if(Settings.get(Settings.ENABLE_SELECTION)) {
            getTemplate('modules/beavers-system-interface/templates/select.hbs')
                .then(
                    template => {
                        this.render(template);
                    }
                );
        }
    }

    render(template) {
        const select = $(this).find('select');
        this.oninput = select[0].oninput || jQuery["_data"]?.(select[0],'events')?.["input"]?.[0]?.handler;
        this.onchange = select[0].onchange || jQuery["_data"]?.(select[0],'events')?.["change"]?.[0]?.handler;
        const name = select.attr("name");
        const disabled = select.attr("disabled");
        const size = select.attr("size");
        this.selected = select.val() as string;
        $(this).html(template({
            choices: this.choices,
            name: name,
            disabled: disabled,
            selected: this.selected,
            size: size
        }));
        this.dropDown = $(this).find('.dropdown');
        $(this).find('input').on('input', (e) => this._onInput(e));
        if(disabled == undefined ) {
            $(this).find('.default-text, .dropdown>i' ).on('click', () => this.toggleDropdown());
            $(this).find('.option').on('mouseover', (event) => this.hoverOption(event));
            $(this).find('.option').on('click', (event) => this.clickOption(event));
        }
        this.select(this.selected,true);
    }

    toggleDropdown() {
        if (this.dropDown.hasClass("active")) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    closeDropdown() {
        this.removeOutsideClick();
        this.dropDown.removeClass("active");
    }

    openDropdown() {
        this.removeOutsideClick = this.onInteractOutside(this.dropDown,
            (selector) => selector.removeClass('active'));
        this.dropDown.addClass('active');
        const option = this.getOption(this.selected);
        this.showOption(option);
        this.scrollToOption(option);
        this.positionDropDown();
    }

    scrollToOption(option){
        const myOffset = option.offset()?.top;
        const container = $(this).find('.dropdown-inner');
        const offset = container.offset()?.top;
        const scrollTop = container.scrollTop();
        if(myOffset && offset && scrollTop){
            const position = myOffset - offset + scrollTop;
            container.scrollTop(position);
        }
        container.get()[0].focus();
    }

    positionDropDown(){
        let top = 0;
        let left= 0;
        const container = $(this).find('.dropdown-inner');
        container.parents().each((p,q)=>{
            const t = $(q).scrollTop();
            const l = $(q).scrollLeft();
            if(t != undefined){
                top = top +t;
            }
            if(l != undefined){
                left = left +l;
            }
        });
        const width = this.dropDown.width() as number
        container.css({position:"absolute",left:-left,top:-top,width:(width-1+3)+"px"});
    }

    select(val: string,initialize: boolean=false) {
        this.selected = val;
        const input = $(this).find('input');
        input.val(val);
        const option = this.getOption(this.selected);
        $(this).find('.default-text').html(option.html());
        this.showOption(option);
        if(!initialize) {
            input.trigger('input');
            input.trigger('change');
        }
    }


    _onInput(e) {
        if(this.oninput){
            this.oninput(e)
        }
    }

    getOption(id: string | undefined): JQuery {
        return $(this).find('.option[data-id="' + id + '"]');
    }

    showOption(option: JQuery) {
        $(this).find('.selected').removeClass('selected');
        option.addClass('selected');
    }

    hoverOption(event) {
        this.showOption($(event.currentTarget));
    }

    clickOption(event) {
        const id = event.currentTarget.dataset.id;
        this.select(id);
        this.closeDropdown();
    }

    onInteractOutside(selector:JQuery,action:(selector:JQuery)=>void):()=>void {
        const interactListener = (event) => {
            const $target = $(event.target);
            if (!$target.closest(selector).length) {
                action(selector);
                removeInteractListener();
            }
        }
        const removeInteractListener = () => {
            document.removeEventListener('mousedown', interactListener);
            document.removeEventListener('wheel',interactListener);
        }
        document.addEventListener('mousedown', interactListener);
        document.addEventListener('wheel',interactListener)
        return removeInteractListener;
    }
}
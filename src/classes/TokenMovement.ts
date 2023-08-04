
/* class decorator */
function staticImplements<T>() {
    return <U extends T>(constructor: U) => {constructor};
}

@staticImplements<GamepadModule>()
export class TokenMovement implements TokenMovementInstance{

    public static defaultConfig: GamepadModuleConfig={
        binding: {
            axes: {
                "Move-horizontal": {
                    index: "0",
                    reversed: false
                },
                "Move-vertical": {
                    index: "1",
                    reversed: false
                },
            },
            buttons:{}
        },
        name: "Beaver's Token Movement",
        id:"beavers-token-movement"
    }

    private X_AXES = "Move-horizontal";
    private Y_AXES = "Move-vertical";
    private UPDATE_TOKEN_HOOK = "updateToken";

    config:GamepadModuleConfig
    actorId: string
    isMoving:boolean = false;
    token?:Token;
    position?:{
        collision:any,
        point:any,
        size:number
    }
    hook?:number

    constructor(actorId:string){
        this.actorId = actorId;
        this.config = TokenMovement.defaultConfig;
    }

    public initialize(actorId:string, config: GamepadModuleConfigBinding){
        this.actorId = actorId;
        this.config.binding = config;
        if(this.hook){
            Hooks.off(this.UPDATE_TOKEN_HOOK,this.hook);
        }
        this.hook = Hooks.on(this.UPDATE_TOKEN_HOOK,this._tokenGotUpdated.bind(this));
    }

    public getConfig(): GamepadModuleConfig{
        return this.config;
    }

    public tick(event: GamepadTickEvent):boolean{
        if(event.hasAnyAxesTicked && this.actorId !== ""){
            let x = 0;
            let y = 0;
            for(const [i,value] of Object.entries(event.axes)){
                x = x || this._get(this.X_AXES,i,value);
                y = y || this._get(this.Y_AXES,i,value);
            }
            this.move(x,y)
        }
        return true;
    }

    public destroy(){
        if(this.hook){
            Hooks.off(this.UPDATE_TOKEN_HOOK,this.hook);
        }
    }

    public move(x, y) {
        if(this.isMoving){
            return
        }
        if (!(canvas instanceof Canvas)) {
            throw new Error("TokenMovement called before canvas has been initialized");
        }
        if(!(game instanceof Game) || game.paused){
            return;
        }
        const token = this._getToken();
        const position = this._getPosition();
        if(position) {
            const movePoint = {...position.point}
            movePoint.x = movePoint.x + x * position.size;
            movePoint.y = movePoint.y + y * position.size;
            const collisionPoint = {...position.collision}
            collisionPoint.x = collisionPoint.x + x * position.size
            collisionPoint.y = collisionPoint.y + y * position.size;
            if (!token.checkCollision(collisionPoint) && this._checkSceneCollision(collisionPoint)) {
                this.isMoving = true;
                token.document.update({
                    ...movePoint,
                    flags: {beaversTokenMovement: true}
                }, {diff: false}).finally(() => {
                    this.isMoving = false;
                    if (this.position) {
                        this.position.point = movePoint;
                        this.position.collision = collisionPoint;
                    }
                })
            }
        }
    }

    private _tokenGotUpdated(token:Token, options:any){
        if(options.flags?.beaversTokenMovement == undefined && token.id === this.token?.id){
            if(options.x != undefined || options.y != undefined){
                this.token = undefined;
            }
        }
    }

    private _get(type:string,i:string,value:number){
        let result = 0;
        const {index,reversed} = this.config.binding.axes[type];
        if(i === index.toString()) {
            if(reversed){
                result = value*-1;
            }else {
                result = value;
            }
        }
        return result;
    }

    private _getToken():Token {
        // @ts-ignore
        const token:Token = canvas.tokens?.objects?.children.find(token => this.actorId.endsWith(token?.actor?.uuid) );
        if(token.id !== this.token?.id) {
            this.position = undefined;
        }
        this.token = token;
        return token;
    }

    private _getPosition(){
        if(!this.position && this.token){
            const token = this.token;
            // @ts-ignore
            const size = canvas?.scene?.dimensions.size;
            const x = Math.round(token.x/size)*size;
            const y = Math.round(token.y/size)*size;
            const center = token.getCenter(x, y);
            this.position ={
                // @ts-ignore
                collision:token.getMovementAdjustedPoint(center),
                point:{
                    x : x,
                    y : y
                },
                size: size
            }
        }
        return this.position;
    }


    private _checkSceneCollision(collisionPoint) {
        if (!(canvas instanceof Canvas)) {
            throw new Error("TokenMovement called before canvas has been initialized");
        }
        // @ts-ignore
        return !(collisionPoint.x < canvas.dimensions?.sceneX
            && collisionPoint.x > 0
            // @ts-ignore
            && collisionPoint.y < canvas.dimensions?.sceneY
            && collisionPoint.y > 0);
    }




}
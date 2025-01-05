
export class Initiator implements InitiatorI{

    actorId: string;
    sceneId: string;
    tokenId?: string;
    userId: string;

    constructor(initiatorData:InitiatorData){
        Object.assign(this, initiatorData);
    }

    get token():Token{
        const token = canvas?.tokens?.get(this.tokenId||"");
        if(token instanceof Token){
            return token;
        }
        throw new Error("Can not find token");
    }
    get actor():Actor{
        const actor = game?.["actors"]?.get(this.actorId);
        if(actor instanceof Actor){
            return actor;
        }
        throw new Error("Can not find actor");
    }
    get user(): User{
        const user = game?.["users"]?.get(this.userId);
        if(user instanceof User){
            return user;
        }
        throw new Error("Can not find user");
    }

    get data():InitiatorData{
        return {
            actorId: this.actorId,
            sceneId: this.sceneId,
            tokenId: this.tokenId,
            userId: this.userId
        }

    }
}
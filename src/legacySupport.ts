
export async function getMyTemplate(path:string){
    if(foundry.applications?.handlebars?.getTemplate){
        return foundry.applications.handlebars.getTemplate(path);
    }
    return getTemplate(path);
}

export const AppClass = foundry?.appv1?.api?.Application || Application;
import "obsidian";

declare module "obsidian"{
    interface Workspace{
        on(
            name:"zk-navigation:refresh-local-graph",
            callback: ()=>unknown
        ):EventRef;
    }

    interface Workspace{
        on(
            name:"zk-navigation:refresh-index-graph",
            callback: ()=>unknown
        ):EventRef;
    }

    interface Workspace{
        on(
            name:"zk-navigation:refresh-outline-view",
            callback: ()=>unknown
        ):EventRef;
    }

    interface Workspace{
        on(
            name:"zk-navigation:refresh-table-view",
            callback: ()=>unknown
        ):EventRef;
    }

    interface Workspace{
        on(
            name:"zk-navigation:refresh-recent-view",
            callback: ()=>unknown
        ):EventRef;
    }

    interface App {
        commands:{
            commands:{
                [id:string]: Command;
            };
            executeCommandById: (id: string) => void;
        }
    }
}

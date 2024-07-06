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
}

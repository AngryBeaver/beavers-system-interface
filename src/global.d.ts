import {
    _SettingConfigRecord,
    GetNamespaces
} from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/core/settings";

declare global {
    interface LenientGlobalVariableTypes {
        game: never; // the type doesn't matter
    }
    namespace ClientSettings {
        export type Namespace = GetNamespaces<keyof _SettingConfigRecord> | "beavers-system-interface"
        export type Key = string |"enableSelection"
    }
}
import { render } from "preact";
import { App } from "./App";
import { isNative } from "./native/platform";
import { preferencesStore } from "./native/preferencesStore";
import { setKeyValueStore } from "./storage/kv";
import "./styles.css";

if (isNative()) setKeyValueStore(preferencesStore);

render(<App />, document.getElementById("app")!);

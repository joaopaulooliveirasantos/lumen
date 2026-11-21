import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { BottomTabBar } from "../src/components/BottomTabBar";

const root = () => document.body.appendChild(document.createElement("div"));
const profileTab = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('button[aria-label="Perfil"]')!;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("aba Perfil do menu inferior", () => {
  it("mostra a foto do perfil quando existe", () => {
    const el = root();
    render(<BottomTabBar activeTab="home" onTabPress={() => undefined} avatarUrl="https://lh3.googleusercontent.com/a/foto" />, el);
    const img = profileTab(el).querySelector("img.tab-avatar");
    expect(img?.getAttribute("src")).toBe("https://lh3.googleusercontent.com/a/foto");
    expect(img?.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(el.querySelectorAll("img")).toHaveLength(1); // só na aba Perfil
  });

  it("mostra o ícone quando não há foto", () => {
    const el = root();
    render(<BottomTabBar activeTab="perfil" onTabPress={() => undefined} avatarUrl={null} />, el);
    expect(profileTab(el).querySelector("img")).toBeNull();
    expect(profileTab(el).querySelector("svg")).not.toBeNull();
  });

  it("volta ao ícone se a foto não carregar", () => {
    const el = root();
    render(<BottomTabBar activeTab="home" onTabPress={() => undefined} avatarUrl="https://exemplo.invalido/foto.jpg" />, el);
    act(() => {
      profileTab(el).querySelector("img")!.dispatchEvent(new Event("error"));
    });
    expect(profileTab(el).querySelector("img")).toBeNull();
    expect(profileTab(el).querySelector("svg")).not.toBeNull();
  });
});

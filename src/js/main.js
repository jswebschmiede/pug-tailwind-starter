import $ from "jquery";

window.jQuery = $;
window.$ = $;

function test() {
  console.log("Hello Gulp");
}

const test2 = () => {
  console.log("Hello ECMA 6");
};

test();
test2();

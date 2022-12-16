/*
view/fconstant.js

D3 utility, not mine
*/


// constant: a fn' wrpper for a value,
// because chained accessors ...

export default function(x) {
  return function() {
    return x;
  };
}

import { expect, test } from 'vitest'
import { termToString, trans_ats, trans_sta } from './code.ts'
import { Scanner } from './parse.ts'

const options = {
  checkOnOffo: false,
  checkOnOffO: false,
  checkOnOffA: false,
  checkOnOffB: false,
  checkOnOffT: false,
}

test('truns(0) === 0', () => {
  expect(termToString(trans_sta([0,2,7,4,5,2,3]), options)).toStrictEqual("ψ_0(ψ_1(ψ_4(0)+ψ_1(1))+ψ_1(1))")
})

test('truns(0) === 0', () => {
  const x = new Scanner("ψ_0(ψ_1(ψ_4(0)+ψ_1(1))+ψ_1(1))").parse_term();
  const outputString = trans_ats(x).join(",");
  expect(outputString).toStrictEqual("0,2,7,4,5,2,3")
})

test('truns(0) === 0', () => {
  const x = new Scanner("(1,0)+(5,0)").parse_term();
  const outputString = trans_ats(x).join(",");
  expect(outputString).toStrictEqual("1,5")
})

test('/^\\d+(,\\d+)*$/.test("(1,0)+(5,0)")', () => {
  expect(/^\d+(,\d+)*$/.test("(1,0)+(5,0)")).toBe(false)
})

test('"1,0".split(",").map((x) => parseInt(x)).filter((x) => !isNaN(x))', () => {
  expect("1,0".split(",").map((x) => parseInt(x)).filter((x) => !isNaN(x))).toStrictEqual([1,0])
})
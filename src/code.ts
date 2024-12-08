// ψの準備
export type ZT = { readonly type: "zero" };
export type RAT = { readonly type: "plus", readonly add: RPT[] };
export type RPT = { readonly type: "psi", readonly sub: number, readonly arg: RT };
export type RT = ZT | RAT | RPT;

export const Z: ZT = { type: "zero" };
export const ONE: RPT = { type: "psi", sub: 0, arg: Z };
export const OMEGA: RPT = { type: "psi", sub: 0, arg: ONE };
export const LOMEGA: RPT = { type: "psi", sub: 1, arg: Z };

// オブジェクトの相等判定
export function equal(s: RT, t: RT): boolean {
    if (s.type === "zero") {
        return t.type === "zero";
    } else if (s.type === "plus") {
        if (t.type !== "plus") return false;
        if (t.add.length !== s.add.length) return false;
        for (let i = 0; i < t.add.length; i++) {
            if (!equal(s.add[i], t.add[i])) return false;
        }
        return true;
    } else {
        if (t.type !== "psi") return false;
        return (s.sub === t.sub) && equal(s.arg, t.arg);
    }
}

export function psi(sub: number, arg: RT): RPT {
    return { type: "psi", sub: sub, arg: arg };
}

// a+b を適切に整形して返す
export function plus(a: RT, b: RT): RT {
    if (a.type === "zero") {
        return b;
    } else if (a.type === "plus") {
        if (b.type === "zero") {
            return a;
        } else if (b.type === "plus") {
            return { type: "plus", add: a.add.concat(b.add) };
        } else {
            return { type: "plus", add: [...a.add, b] };
        }
    } else {
        if (b.type === "zero") {
            return a;
        } else if (b.type === "plus") {
            return { type: "plus", add: [a, ...b.add] };
        } else {
            return { type: "plus", add: [a, b] };
        }
    }
}

// 要素が1個の配列は潰してから返す
export function sanitize_plus_term(add: RPT[]): RPT | RAT {
    if (add.length === 1) {
        return add[0];
    } else {
        return { type: "plus", add: add };
    }
}

// nより大きい方
export function replace(n: number, s: RT): RT {
    if (s.type === "zero") {
        return Z;
    } else if (s.type === "plus") {
        const a = s.add[0];
        const b = sanitize_plus_term(s.add.slice(1));
        return plus(replace(n, a), replace(n, b));
    } else {
        return psi(n, s.arg);
    }
}

// 本編
// ===========================================

export function trans_ats(s: RT): number[] {
    if (s.type === "zero") {
        return [];
    } else if (s.type === "plus") {
        return trans_ats(s.add[0]).concat(trans_ats(sanitize_plus_term(s.add.slice(1))));
    } else {
        const a = s.sub;
        const b = s.arg;
        return [a].concat(trans_ats(b).map(x => x+a+1));;
    }
}

export function trans_sta(alpha: number[]): RT {
    if (alpha.length === 0) return Z;
    const parent = (k: number): number | null => {
        let p = k-1;
        while (p > -1) {
            if (alpha[p] < alpha[k]) return p;
            p -= 1;
        }
        return null;
    }
    let i = 1;
    while (i < alpha.length) {
        if (parent(i) === null) break;
        i += 1;
    }
    if (i < alpha.length) return plus(trans_sta(alpha.slice(0,i)),trans_sta(alpha.slice(i)));
    if (alpha.length === 1) return psi(alpha[0],Z);
    const a = alpha[0];
    const b = trans_sta(alpha.slice(1).map(x => x-(a+1)));
    return psi(a,b);
}

// 翻訳
// ===========================================

export type Options = {
    checkOnOffo: boolean;
    checkOnOffO: boolean;
    checkOnOffA: boolean;
    checkOnOffB: boolean;
    checkOnOffT: boolean;
};

// オブジェクトから文字列へ
function term_to_string(t: RT, options: Options): string {
    if (t.type === "zero") {
        return "0";
    } else if (t.type === "psi") {
        if (!(options.checkOnOffB && t.sub === 0)) {
            if (options.checkOnOffA) {
                return "ψ(" + t.sub + "," + term_to_string(t.arg, options) + ")";
            }
            if (options.checkOnOffT)
                return "ψ_{" + t.sub + "}(" + term_to_string(t.arg, options) + ")";
            return "ψ_" + t.sub + "(" + term_to_string(t.arg, options) + ")";
        }
        return "ψ(" + term_to_string(t.arg, options) + ")";
    } else {
        return t.add.map((x) => term_to_string(x, options)).join("+");
    }
}

function to_TeX(str: string): string {
    str = str.replace(RegExp("ψ", "g"), "\\psi");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    return str;
}

function abbrviate(str: string, options: Options): string {
    str = str.replace(RegExp("ψ\\(0\\)", "g"), "1");
    str = str.replace(RegExp("ψ_\\{0\\}\\(0\\)", "g"), "1");
    str = str.replace(RegExp("ψ_0\\(0\\)", "g"), "1");
    str = str.replace(RegExp("ψ\\(0,0\\)", "g"), "1");
    if (options.checkOnOffo) {
        str = str.replace(RegExp("ψ\\(1\\)", "g"), "ω");
        str = str.replace(RegExp("ψ_\\{0\\}\\(1\\)", "g"), "ω");
        str = str.replace(RegExp("ψ_0\\(1\\)", "g"), "ω");
        str = str.replace(RegExp("ψ\\(0,1\\)", "g"), "ω");
    }
    if (options.checkOnOffO) {
        str = str.replace(RegExp("ψ_\\{1\\}\\(0\\)", "g"), "Ω");
        str = str.replace(RegExp("ψ_1\\(0\\)", "g"), "Ω");
        str = str.replace(RegExp("ψ\\(1,0\\)", "g"), "Ω");
    }
    if (options.checkOnOffT) str = to_TeX(str);
    while (true) {
        const numterm = str.match(/1(\+1)+/);
        if (!numterm) break;
        const matches = numterm[0].match(/1/g);
        if (!matches) throw Error("そんなことある？");
        const count = matches.length;
        str = str.replace(numterm[0], count.toString());
    }
    return str;
}

export function termToString(t: RT, options: Options): string {
    return abbrviate(term_to_string(t, options), options);
}
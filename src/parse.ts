import { RT, RPT, Z, ONE, sanitize_plus_term, OMEGA, LOMEGA, psi } from "./code";

function from_nat(num: number): RT {
    if (num === 0) return Z;
    const numterm: RPT[] = [];
    while (num > 0) {
        numterm.push(ONE);
        num--;
    }
    return sanitize_plus_term(numterm);
}

function is_numchar(ch: string): boolean {
    // クソが代斉唱
    return (
        ch === "0" ||
        ch === "1" ||
        ch === "2" ||
        ch === "3" ||
        ch === "4" ||
        ch === "5" ||
        ch === "6" ||
        ch === "7" ||
        ch === "8" ||
        ch === "9"
    );
}

export class Scanner {
    str: string;
    pos: number;
    constructor(str: string) {
        this.str = str.replace(/\s/g, ""); // 空白は無視
        this.pos = 0;
    }

    // 次の文字が期待した文字なら1文字進め、trueを返す。
    // 次の文字が期待した文字でないなら何もせず、falseを返す。
    consume(op: string): boolean {
        if (this.str[this.pos] !== op) return false;
        this.pos += 1;
        return true;
    }

    consumeStrHead(): boolean {
        const ch = this.str[this.pos];
        if (/^[<>[\]1234567890ωΩwW{}_()]$/.test(ch)) return false;
        this.pos += 1;
        return true;
    }

    // 次の文字が期待した文字なら1文字進める。
    // 次の文字が期待した文字でないなら例外を投げる。
    expect(op: string): void {
        const ch = this.str[this.pos];
        if (ch === undefined)
            throw Error(
                `${this.pos + 1}文字目に${op}が期待されていましたが、これ以上文字がありません`,
            );
        if (ch !== op)
            throw Error(`${this.pos + 1}文字目に${op}が期待されていましたが、${ch}が見つかりました`);
        this.pos += 1;
    }

    parse_number(): number {
        let num = parseInt(this.str[this.pos]);
        this.pos += 1;
        while (is_numchar(this.str[this.pos])) {
            num = num * 10 + parseInt(this.str[this.pos]);
            this.pos += 1;
        }
        return num;
    }

    // 式をパース
    parse_term(): RT {
        if (this.str === "") throw Error(`Empty string`);
        if (this.consume("0")) {
            return Z;
        } else {
            let list: RPT[] = [];
            do {
                let term: RT;
                if (is_numchar(this.str[this.pos])) term = from_nat(this.parse_number());
                else term = this.parse_principal();
                if (term.type === "zero") throw Error(`0は+で接続できません`);
                else if (term.type === "plus") list = list.concat(term.add);
                else list.push(term);
            } while (this.consume("+"));
            return sanitize_plus_term(list);
        }
    }

    // principal psi termのパース
    parse_principal(): RPT {
        if (this.consume("1")) {
            return ONE;
        } else if (this.consume("w") || this.consume("ω")) {
            return OMEGA;
        } else if (this.consume("W") || this.consume("Ω")) {
            return LOMEGA;
        } else {
            let sub: number;
            if (this.consumeStrHead()) {
                if (this.consume("(")) {
                    if (is_numchar(this.str[this.pos])) {
                        const position = this.pos;
                        const arg = this.parse_term();
                        if (this.consume(")")) return psi(0,arg);
                        this.pos = position;
                        sub = this.parse_number();
                        this.expect(",");
                    } else {
                        const arg = this.parse_term();
                        this.expect(")");
                        return psi(0,arg);
                    }
                } else {
                    this.consume("_");
                    if (this.consume("{")) {
                        sub = this.parse_number();
                        this.expect("}");
                        this.expect("(");
                    } else {
                        sub = this.parse_number();
                        this.expect("(");
                    }
                }
            } else {
                if (this.consume("(")) {
                    if (is_numchar(this.str[this.pos])) {
                        const position = this.pos;
                        const arg = this.parse_term();
                        if (this.consume(")")) return psi(0,arg);
                        this.pos = position;
                        sub = this.parse_number();
                        this.expect(",");
                    } else {
                        const arg = this.parse_term();
                        this.expect(")");
                        return psi(0,arg);
                    }
                } else {
                    this.expect("{");
                    sub = this.parse_number();
                    this.expect("}");
                    this.expect("(");
                }
            }
            const arg = this.parse_term();
            this.expect(")");
            return psi(sub,arg);
        }
    }
}
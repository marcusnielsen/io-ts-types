import * as t from 'io-ts'

import { Either, Right, Left, left, right } from 'fp-ts/lib/Either'

export interface JSONLeft<L> {
  type: 'Left'
  value: L
}

export interface JSONRight<A> {
  type: 'Right'
  value: A
}

export type JSONEither<L, A> = JSONLeft<L> | JSONRight<A>

export class EitherFromJSONType<L extends t.Any, R extends t.Any, A = any, O = A, I = t.mixed> extends t.Type<A, O, I> {
  readonly _tag: 'EitherFromJSONType' = 'EitherFromJSONType'
  constructor(
    name: string,
    is: EitherFromJSONType<L, R, A, O, I>['is'],
    validate: EitherFromJSONType<L, R, A, O, I>['validate'],
    serialize: EitherFromJSONType<L, R, A, O, I>['encode'],
    readonly left: L,
    readonly right: R
  ) {
    super(name, is, validate, serialize)
  }
}

export function createEitherFromJSON<
  L extends t.Type<AL, OL>,
  R extends t.Type<AR, OR>,
  AL = any,
  OL = AL,
  AR = any,
  OR = AR
>(
  leftType: L,
  rightType: R,
  name: string = `Either<${leftType.name}, ${rightType.name}>`
): EitherFromJSONType<L, R, Either<t.TypeOf<L>, t.TypeOf<R>>, JSONEither<t.OutputOf<L>, t.OutputOf<R>>, t.mixed> {
  const JSONLeft = t.type({
    type: t.literal('Left'),
    value: leftType
  })
  const JSONRight = t.type({
    type: t.literal('Right'),
    value: rightType
  })
  const JSONEither = t.taggedUnion('type', [JSONLeft, JSONRight])
  return new EitherFromJSONType(
    name,
    (m): m is Either<t.TypeOf<L>, t.TypeOf<R>> =>
      (m instanceof Right && rightType.is(m.value)) || (m instanceof Left && leftType.is(m.value)),
    (m, c) => {
      const validation = JSONEither.validate(m, c)
      if (validation.isLeft()) {
        return validation as any
      } else {
        const e = validation.value
        switch (e.type) {
          case 'Left':
            return t.success(left(e.value))
          case 'Right':
            return t.success(right(e.value))
        }
      }
    },
    a =>
      a.fold<JSONEither<t.OutputOf<L>, t.OutputOf<R>>>(
        l => ({ type: 'Left', value: leftType.encode(l) }),
        a => ({ type: 'Right', value: rightType.encode(a) })
      ),
    leftType,
    rightType
  )
}

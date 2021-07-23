import { VariableDefinition } from '../custom-header-format/variable-definition'
import { createMockStore } from '../insomnia/mocks/store-mock'
import { ResponseContext } from '../insomnia/types/response-context'
import { ResponseHookContext } from '../insomnia/types/response-hook-context'
import { variableSavingResponseHook } from './response-hook'

describe('Variable Saving Response Hook', () => {
  const getBodyMock = jest.fn()
  const store = createMockStore()
  const context = ({
    response: ({
      getBody: getBodyMock,
    } as Partial<ResponseContext>) as ResponseContext,
    store,
  } as Partial<ResponseHookContext>) as ResponseHookContext

  beforeEach(async () => {
    await store.clear()
  })

  it('should read the response body value into a variable using json path', async () => {
    const VariableDefinition: VariableDefinition = {
      variableName: 'ticket',
      attribute: 'body',
      path: '$.ticketId',
    }
    const body = {
      someValue: 'test',
      ticketId: '123',
    }
    await store.setItem('variableDefinitions', JSON.stringify([VariableDefinition]))
    getBodyMock.mockReturnValue(JSON.stringify(body))

    await variableSavingResponseHook(context)

    expect(await store.getItem('variable-ticket')).toEqual(body.ticketId)
  })

  it('should not read the response body or set any variables if no variable definitions are present', async () => {
    // nothing to arrange

    await variableSavingResponseHook(context)

    expect(getBodyMock).not.toHaveBeenCalled()
    expect(await store.all()).toEqual([])
  })

  it('should remove variable definitions after using them so that they do not get reused by a different request', async () => {
    const VariableDefinition: VariableDefinition = {
      variableName: 'ticket',
      attribute: 'body',
      path: '$',
    }
    const body = {
      someValue: 'test',
      ticketId: '123',
    }
    await store.setItem('variableDefinitions', JSON.stringify([VariableDefinition]))
    getBodyMock.mockReturnValue(JSON.stringify(body))

    await variableSavingResponseHook(context)

    expect(await store.getItem('variableDefinitions')).toEqual(undefined)
  })

  it('should not save variable if key cannot be found at path specified by json path', async () => {
    const VariableDefinition: VariableDefinition = {
      variableName: 'ticket',
      attribute: 'body',
      path: '$.doesNotExist',
    }
    const body = {
      ticketId: '123',
    }
    await store.setItem('variableDefinitions', JSON.stringify([VariableDefinition]))
    getBodyMock.mockReturnValue(JSON.stringify(body))

    await variableSavingResponseHook(context)

    expect(await store.all()).toEqual([])
  })

  it('should save variable if value at key is expicitly null', async () => {
    const VariableDefinition: VariableDefinition = {
      variableName: 'ticket',
      attribute: 'body',
      path: '$.ticketId',
    }
    const body = {
      ticketId: null,
    }
    await store.setItem('variableDefinitions', JSON.stringify([VariableDefinition]))
    getBodyMock.mockReturnValue(JSON.stringify(body))

    await variableSavingResponseHook(context)

    expect(await store.getItem('variable-ticket')).toEqual(null)
  })

  it('should not save variable if response body cannot be parsed as json', async () => {
    const VariableDefinition: VariableDefinition = {
      variableName: 'ticket',
      attribute: 'body',
      path: '$.ticketId',
    }
    const body = 'Hello. I am not JSON'
    await store.setItem('variableDefinitions', JSON.stringify([VariableDefinition]))
    getBodyMock.mockReturnValue(JSON.stringify(body))

    await variableSavingResponseHook(context)

    expect(await store.all()).toEqual([])
  })
})

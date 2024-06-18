// import React from 'react'

// import { useObservableClass } from '../mobx/hooks'
// import { observer, setter } from '../mobx/misc'
// import { request } from '../mobx/request'
// import Store from '../stores/Store'
// import { DEFAULT_FORM_ERROR, preventingDefault } from '../utils'
// import { vibefetch } from '../vibefetch'
// import Button from './core/Button'
// import Checkbox from './core/Checkbox'
// import Col from './core/Col'
// import ErrorMessage from './core/ErrorMessage'
// import Input from './core/Input'
// import RadioGroup from './core/RadioGroup'
// import Spacer from './core/Spacer'

// type Props = {
//     onSuccess: () => void
// }

// export default observer((props: Props) => {
//     const state = useObservableClass(class {

//         showingErrors = false

//         application = {
//             name: '',
//             twitter_handle: '',
//             hoping_to_get_out_of_the_festival: '',
//             experiences_hoping_to_share: '',
//             identify_as: '',
//             looking_forward_to_conversations: new Set<string>(),
//             last_conversation: '',
//             strongest_virtues: new Set<string>(),
//             attractive_virtues: new Set<string>(),
//             group_activity: '',
//             interested_in_volunteering: null as null | boolean,
//             how_found_out: '',
//             previous_events: '',
//             anything_else: '',
//         }

//         get nameError() {
//             if (!this.application.name) {
//                 return 'Please enter your name'
//             }
//         }

//         get twitterHandleError() {
//             if (this.application.twitter_handle?.startsWith('@')) {
//                 return 'No @ needed, just the rest of the handle'
//             }
//         }

//         get hopingToGetOutOfError() {
//             if (!this.application.hoping_to_get_out_of_the_festival) {
//                 return 'Please fill out this field'
//             }
//         }

//         get experiencesToShareError() {
//             if (!this.application.experiences_hoping_to_share) {
//                 return 'Please fill out this field'
//             }
//         }

//         get identifyAsError() {
//             if (!this.application.identify_as) {
//                 return 'Please fill out this field'
//             }
//         }

//         get lastConversationError() {
//             if (!this.application.last_conversation) {
//                 return 'Please fill out this field'
//             }
//         }

//         get groupActivityError() {
//             if (!this.application.group_activity) {
//                 return 'Please fill out this field'
//             }
//         }

//         get howFoundOutError() {
//             if (!this.application.how_found_out) {
//                 return 'Please fill out this field'
//             }
//         }

//         get previousEventsError() {
//             if (!this.application.previous_events) {
//                 return 'Please fill out this field'
//             }
//         }

//         get isValid() {
//             return !this.nameError
//                 && !this.twitterHandleError
//                 && !this.hopingToGetOutOfError
//                 && !this.experiencesToShareError
//                 && !this.identifyAsError
//                 && !this.lastConversationError
//                 && !this.groupActivityError
//                 && !this.previousEventsError
//         }

//         readonly submitApplication = request(async () => {
//             if (!this.isValid) {
//                 this.showingErrors = true
//                 return
//             }

//             const { status } = await vibefetch(Store.jwt, '/account/submit-application', 'post', {
//                 ...this.application,
//                 looking_forward_to_conversations: Array.from(this.application.looking_forward_to_conversations).join(', '),
//                 strongest_virtues: Array.from(this.application.strongest_virtues).join(', '),
//                 attractive_virtues: Array.from(this.application.attractive_virtues).join(', ')
//             })

//             if (status === 200) {
//                 props.onSuccess()
//             }
//         }, { lazy: true })
//     })

//     return (
//         <form onSubmit={preventingDefault(state.submitApplication.load)}>
//             <Col padding={20} pageLevel>
//                 <Input
//                     label='What is your name?'
//                     value={state.application.name}
//                     onChange={setter(state.application, 'name')}
//                     error={state.showingErrors && state.nameError}
//                 />

//                 <Spacer size={24} />

//                 <Input
//                     label='What is your twitter handle? (without the @)'
//                     value={state.application.twitter_handle ?? ''}
//                     onChange={setter(state.application, 'twitter_handle')}
//                     error={state.showingErrors && state.twitterHandleError}
//                 />

//                 <Spacer size={24} />

//                 <Input
//                     label='What are you hoping to get out of the festival?'
//                     value={state.application.hoping_to_get_out_of_the_festival}
//                     onChange={setter(state.application, 'hoping_to_get_out_of_the_festival')}
//                     error={state.showingErrors && state.hopingToGetOutOfError}
//                     multiline
//                 />

//                 <Spacer size={24} />

//                 <Input
//                     label={'What experiences are you hoping to share with others at vibecamp? (We won\'t hold you to this!) This can include things like friendmaking/sociaskills/art workshops, being a good listening/conversation partner, anything eclipse/space/woo related...'}
//                     value={state.application.experiences_hoping_to_share}
//                     onChange={setter(state.application, 'experiences_hoping_to_share')}
//                     error={state.showingErrors && state.experiencesToShareError}
//                     multiline
//                 />

//                 <Spacer size={24} />

//                 <RadioGroup
//                     label='Which do you most closely identify as?'
//                     options={GENDER_OPTIONS}
//                     value={state.application.identify_as}
//                     onChange={setter(state.application, 'identify_as')}
//                     error={state.showingErrors && state.identifyAsError}
//                 />

//                 <Spacer size={24} />

//                 <CheckboxSet
//                     label='What type of conversations are you looking forward to at vibecamp?'
//                     set={state.application.looking_forward_to_conversations}
//                     options={CONVERSATION_SUBJECTS}
//                 />

//                 <Spacer size={24} />

//                 <Input
//                     label='What was the last conversation you had that you really enjoyed? Why was it so enjoyable for you?'
//                     value={state.application.last_conversation}
//                     onChange={setter(state.application, 'last_conversation')}
//                     error={state.showingErrors && state.lastConversationError}
//                     multiline
//                 />

//                 <Spacer size={24} />

//                 <CheckboxSet
//                     label='What would your closest friend say are your two strongest virtues? Choose the two that you think fit best.'
//                     set={state.application.strongest_virtues}
//                     options={VIRTUES}
//                     maxItems={2}
//                 />

//                 <Spacer size={24} />

//                 <CheckboxSet
//                     label='What virtues do you find most attractive in other people?'
//                     set={state.application.attractive_virtues}
//                     options={VIRTUES}
//                 />

//                 <Spacer size={24} />

//                 <Input
//                     label='What is a group activity you did that you really enjoyed, even if it was many years ago? Who was there? What did you do? What made it so enjoyable? Get descriptive!'
//                     value={state.application.group_activity}
//                     onChange={setter(state.application, 'group_activity')}
//                     error={state.showingErrors && state.groupActivityError}
//                     multiline
//                 />

//                 <Spacer size={24} />

//                 <RadioGroup
//                     label='Are you interested in volunteering at the festival?'
//                     options={YES_NO_OPTIONS}
//                     value={state.application.interested_in_volunteering}
//                     onChange={setter(state.application, 'interested_in_volunteering')}
//                 />

//                 <Spacer size={24} />

//                 <Input
//                     label='How did you find out about this event?'
//                     value={state.application.how_found_out}
//                     onChange={setter(state.application, 'how_found_out')}
//                     error={state.showingErrors && state.howFoundOutError}
//                     multiline
//                 />

//                 <Spacer size={24} />

//                 <RadioGroup
//                     label='Have you been to any previous vibecamp events?'
//                     options={PREVIOUS_EVENTS_OPTIONS}
//                     value={state.application.previous_events}
//                     onChange={setter(state.application, 'previous_events')}
//                     error={state.showingErrors && state.previousEventsError}
//                 />

//                 <Spacer size={24} />

//                 <Input
//                     label='Is there anything else you would like us to know?'
//                     value={state.application.anything_else}
//                     onChange={setter(state.application, 'anything_else')}
//                     multiline
//                 />

//                 <Spacer size={24} />

//                 <ErrorMessage
//                     error={state.submitApplication.state.kind === 'error' && DEFAULT_FORM_ERROR}
//                 />

//                 <Spacer size={16} />

//                 <Button isSubmit isPrimary isLoading={state.submitApplication.state.kind === 'loading'}>
//                     Submit application
//                 </Button>
//             </Col>
//         </form>
//     )
// })

// const CheckboxSet = observer((props: { label: string, set: Set<string>, options: readonly string[], maxItems?: number }) => {
//     return (
//         <>
//             <div>
//                 {props.label}
//             </div>

//             {props.options.map(option =>
//                 <React.Fragment key={option}>
//                     <Spacer size={8} />
//                     <Checkbox
//                         value={props.set.has(option)}
//                         onChange={checked => {
//                             if (checked) {
//                                 props.set.add(option)
//                             } else {
//                                 props.set.delete(option)
//                             }
//                         }}
//                         disabled={
//                             !props.set.has(option) &&
//                             props.maxItems != null &&
//                             props.set.size >= props.maxItems
//                         }
//                     >
//                         {option}
//                     </Checkbox>
//                 </React.Fragment>)}
//         </>
//     )
// })

// const stringToOption = (s: string) => ({ value: s, label: s })

// const GENDER_OPTIONS = ([
//     'Man',
//     'Woman',
//     'Non-binary',
//     'Other'
// ] as const).map(stringToOption)

// const CONVERSATION_SUBJECTS = [
//     'Art',
//     'Tech',
//     'Government/Politics',
//     'Health',
//     'Math',
//     'Meditation/Consciousness/Psychonautics',
//     'Music',
//     'Philosophy',
//     'Religion',
//     'Self-improvement',
//     'Literature'
// ] as const

// const VIRTUES = [
//     'Assertiveness',
//     'Based',
//     'Cooperation',
//     'Courage',
//     'Creativity',
//     'Cringe',
//     'Curiosity',
//     'Generosity',
//     'Honesty',
//     'Honor',
//     'Humility',
//     'Integrity',
//     'Joy',
//     'Kindness',
//     'Love',
//     'Patience',
//     'Peacefulness'
// ] as const

// const YES_NO_OPTIONS = [
//     { value: true, label: 'Yes' },
//     { value: false, label: 'No' },
// ] as const

// const PREVIOUS_EVENTS_OPTIONS = ([
//     'Yes (2022)',
//     'Yes (2023)',
//     'Yes (both)',
//     'No'
// ] as const).map(stringToOption)

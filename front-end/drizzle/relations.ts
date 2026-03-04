import { relations } from "drizzle-orm/relations";
import { account, eventBookmark, event, application, festival, purchaseType, festivalSite, eventSite, discount, inviteCode, faqNode, storedImage, attendee, badgeInfo, eventType, accountPasswordResetSecret, ageRange, volunteerType, diet, purchase, attendeeCabin, cabin } from "./schema";

export const eventBookmarkRelations = relations(eventBookmark, ({one}) => ({
	account: one(account, {
		fields: [eventBookmark.accountId],
		references: [account.accountId]
	}),
	event: one(event, {
		fields: [eventBookmark.eventId],
		references: [event.eventId]
	}),
}));

export const accountRelations = relations(account, ({one, many}) => ({
	eventBookmarks: many(eventBookmark),
	application: one(application, {
		fields: [account.applicationId],
		references: [application.applicationId]
	}),
	inviteCodes_createdByAccountId: many(inviteCode, {
		relationName: "inviteCode_createdByAccountId_account_accountId"
	}),
	inviteCodes_usedByAccountId: many(inviteCode, {
		relationName: "inviteCode_usedByAccountId_account_accountId"
	}),
	storedImages: many(storedImage),
	events: many(event),
	accountPasswordResetSecrets: many(accountPasswordResetSecret),
	attendees: many(attendee),
	purchases: many(purchase),
}));

export const eventRelations = relations(event, ({one, many}) => ({
	eventBookmarks: many(eventBookmark),
	account: one(account, {
		fields: [event.createdByAccountId],
		references: [account.accountId]
	}),
	eventSite: one(eventSite, {
		fields: [event.eventSiteLocation],
		references: [eventSite.eventSiteId]
	}),
	eventType: one(eventType, {
		fields: [event.eventType],
		references: [eventType.eventTypeId]
	}),
}));

export const applicationRelations = relations(application, ({many}) => ({
	accounts: many(account),
}));

export const purchaseTypeRelations = relations(purchaseType, ({one, many}) => ({
	festival: one(festival, {
		fields: [purchaseType.festivalId],
		references: [festival.festivalId]
	}),
	discounts: many(discount),
	purchases: many(purchase),
}));

export const festivalRelations = relations(festival, ({one, many}) => ({
	purchaseTypes: many(purchaseType),
	festivalSite: one(festivalSite, {
		fields: [festival.festivalSiteId],
		references: [festivalSite.festivalSiteId]
	}),
	inviteCodes: many(inviteCode),
	badgeInfos: many(badgeInfo),
	attendeeCabins: many(attendeeCabin),
}));

export const festivalSiteRelations = relations(festivalSite, ({many}) => ({
	festivals: many(festival),
	eventSites: many(eventSite),
	cabins: many(cabin),
}));

export const eventSiteRelations = relations(eventSite, ({one, many}) => ({
	festivalSite: one(festivalSite, {
		fields: [eventSite.festivalSiteId],
		references: [festivalSite.festivalSiteId]
	}),
	events: many(event),
}));

export const discountRelations = relations(discount, ({one, many}) => ({
	purchaseType: one(purchaseType, {
		fields: [discount.purchaseTypeId],
		references: [purchaseType.purchaseTypeId]
	}),
	purchases: many(purchase),
}));

export const inviteCodeRelations = relations(inviteCode, ({one}) => ({
	account_createdByAccountId: one(account, {
		fields: [inviteCode.createdByAccountId],
		references: [account.accountId],
		relationName: "inviteCode_createdByAccountId_account_accountId"
	}),
	festival: one(festival, {
		fields: [inviteCode.festivalId],
		references: [festival.festivalId]
	}),
	account_usedByAccountId: one(account, {
		fields: [inviteCode.usedByAccountId],
		references: [account.accountId],
		relationName: "inviteCode_usedByAccountId_account_accountId"
	}),
}));

export const faqNodeRelations = relations(faqNode, ({one, many}) => ({
	faqNode: one(faqNode, {
		fields: [faqNode.parentFaqNodeId],
		references: [faqNode.faqNodeId],
		relationName: "faqNode_parentFaqNodeId_faqNode_faqNodeId"
	}),
	faqNodes: many(faqNode, {
		relationName: "faqNode_parentFaqNodeId_faqNode_faqNodeId"
	}),
}));

export const storedImageRelations = relations(storedImage, ({one, many}) => ({
	account: one(account, {
		fields: [storedImage.ownedByAccountId],
		references: [account.accountId]
	}),
	badgeInfos: many(badgeInfo),
}));

export const badgeInfoRelations = relations(badgeInfo, ({one}) => ({
	attendee: one(attendee, {
		fields: [badgeInfo.attendeeId],
		references: [attendee.attendeeId]
	}),
	storedImage: one(storedImage, {
		fields: [badgeInfo.badgePictureImageId],
		references: [storedImage.storedImageId]
	}),
	festival: one(festival, {
		fields: [badgeInfo.festivalId],
		references: [festival.festivalId]
	}),
}));

export const attendeeRelations = relations(attendee, ({one, many}) => ({
	badgeInfos: many(badgeInfo),
	ageRange: one(ageRange, {
		fields: [attendee.ageRange],
		references: [ageRange.ageRange]
	}),
	account: one(account, {
		fields: [attendee.associatedAccountId],
		references: [account.accountId]
	}),
	volunteerType: one(volunteerType, {
		fields: [attendee.interestedInVolunteeringAs],
		references: [volunteerType.volunteerTypeId]
	}),
	diet: one(diet, {
		fields: [attendee.diet],
		references: [diet.dietId]
	}),
	attendeeCabins: many(attendeeCabin),
}));

export const eventTypeRelations = relations(eventType, ({many}) => ({
	events: many(event),
}));

export const accountPasswordResetSecretRelations = relations(accountPasswordResetSecret, ({one}) => ({
	account: one(account, {
		fields: [accountPasswordResetSecret.accountId],
		references: [account.accountId]
	}),
}));

export const ageRangeRelations = relations(ageRange, ({many}) => ({
	attendees: many(attendee),
}));

export const volunteerTypeRelations = relations(volunteerType, ({many}) => ({
	attendees: many(attendee),
}));

export const dietRelations = relations(diet, ({many}) => ({
	attendees: many(attendee),
}));

export const purchaseRelations = relations(purchase, ({one}) => ({
	discount: one(discount, {
		fields: [purchase.appliedDiscount],
		references: [discount.discountId]
	}),
	account: one(account, {
		fields: [purchase.ownedByAccountId],
		references: [account.accountId]
	}),
	purchaseType: one(purchaseType, {
		fields: [purchase.purchaseTypeId],
		references: [purchaseType.purchaseTypeId]
	}),
}));

export const attendeeCabinRelations = relations(attendeeCabin, ({one}) => ({
	attendee: one(attendee, {
		fields: [attendeeCabin.attendeeId],
		references: [attendee.attendeeId]
	}),
	cabin: one(cabin, {
		fields: [attendeeCabin.cabinId],
		references: [cabin.cabinId]
	}),
	festival: one(festival, {
		fields: [attendeeCabin.festivalId],
		references: [festival.festivalId]
	}),
}));

export const cabinRelations = relations(cabin, ({one, many}) => ({
	attendeeCabins: many(attendeeCabin),
	festivalSite: one(festivalSite, {
		fields: [cabin.festivalSiteId],
		references: [festivalSite.festivalSiteId]
	}),
}));
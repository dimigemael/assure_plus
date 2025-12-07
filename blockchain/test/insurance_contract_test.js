const InsuranceContract = artifacts.require("InsuranceContract");

/*
 * Tests pour le Smart Contract InsuranceContract
 * Auteur: TAHUE TCHOUTCHOUA GEMAEL DIMITRI
 */

contract("InsuranceContract", (accounts) => {
    let instance;
    const [owner, user1, user2, expert] = accounts;

    // Variables pour les tests
    const coverageAmount = web3.utils.toWei('10', 'ether');
    const premium = web3.utils.toWei('0.1', 'ether');
    const duration = 31536000; // 1 an en secondes

    beforeEach(async () => {
        // Déployer un nouveau contrat avant chaque test
        instance = await InsuranceContract.new();
    });

    describe("Deployment", () => {
        it("should set the correct owner", async () => {
            const contractOwner = await instance.owner();
            assert.equal(contractOwner, owner, "Owner should be set correctly");
        });

        it("should initialize counters to 0", async () => {
            const policyCounter = await instance.policyCounter();
            const claimCounter = await instance.claimCounter();

            assert.equal(policyCounter.toNumber(), 0, "Policy counter should be 0");
            assert.equal(claimCounter.toNumber(), 0, "Claim counter should be 0");
        });
    });

    describe("Policy Creation", () => {
        it("should create a policy successfully", async () => {
            const result = await instance.createPolicy(
                coverageAmount,
                premium,
                duration,
                { from: user1, value: premium }
            );

            // Vérifier l'événement émis
            assert.equal(result.logs[0].event, 'PolicyCreated', "PolicyCreated event should be emitted");
            assert.equal(result.logs[0].args.policyId.toNumber(), 1, "Policy ID should be 1");
            assert.equal(result.logs[0].args.insured, user1, "Insured should be user1");
            assert.equal(result.logs[0].args.coverageAmount.toString(), coverageAmount, "Coverage amount should match");
        });

        it("should increment policy counter", async () => {
            await instance.createPolicy(coverageAmount, premium, duration, { from: user1, value: premium });
            const policyCounter = await instance.policyCounter();
            assert.equal(policyCounter.toNumber(), 1, "Policy counter should be 1");
        });

        it("should revert if premium is insufficient", async () => {
            try {
                await instance.createPolicy(
                    coverageAmount,
                    premium,
                    duration,
                    { from: user1, value: web3.utils.toWei('0.05', 'ether') }
                );
                assert.fail("Should have reverted");
            } catch (error) {
                assert(error.message.includes("Prime insuffisante"), "Error message should contain 'Prime insuffisante'");
            }
        });

        it("should revert if coverage amount is 0", async () => {
            try {
                await instance.createPolicy(0, premium, duration, { from: user1, value: premium });
                assert.fail("Should have reverted");
            } catch (error) {
                assert(error.message.includes("Montant de couverture invalide"));
            }
        });

        it("should store policy data correctly", async () => {
            await instance.createPolicy(coverageAmount, premium, duration, { from: user1, value: premium });

            const policy = await instance.getPolicy(1);
            assert.equal(policy.insured, user1);
            assert.equal(policy.coverageAmount.toString(), coverageAmount);
            assert.equal(policy.premium.toString(), premium);
            assert.equal(policy.isActive, true);
            assert.equal(policy.balance.toString(), premium);
        });
    });

    describe("Premium Payment", () => {
        beforeEach(async () => {
            await instance.createPolicy(coverageAmount, premium, duration, { from: user1, value: premium });
        });

        it("should allow paying premium for active policy", async () => {
            const result = await instance.payPremium(1, { from: user1, value: premium });

            assert.equal(result.logs[0].event, 'PremiumPaid');
            assert.equal(result.logs[0].args.policyId.toNumber(), 1);
            assert.equal(result.logs[0].args.amount.toString(), premium);
        });

        it("should increase policy balance", async () => {
            const balanceBefore = (await instance.getPolicy(1)).balance;
            await instance.payPremium(1, { from: user1, value: premium });
            const balanceAfter = (await instance.getPolicy(1)).balance;

            assert.equal(
                balanceAfter.toString(),
                web3.utils.toBN(balanceBefore).add(web3.utils.toBN(premium)).toString()
            );
        });

        it("should revert if caller is not the insured", async () => {
            try {
                await instance.payPremium(1, { from: user2, value: premium });
                assert.fail("Should have reverted");
            } catch (error) {
                assert(error.message.includes("Non autorise"));
            }
        });

        it("should revert if premium amount is insufficient", async () => {
            try {
                await instance.payPremium(1, { from: user1, value: web3.utils.toWei('0.05', 'ether') });
                assert.fail("Should have reverted");
            } catch (error) {
                assert(error.message.includes("Montant insuffisant"));
            }
        });
    });

    describe("Claim Declaration", () => {
        beforeEach(async () => {
            await instance.createPolicy(coverageAmount, premium, duration, { from: user1, value: premium });
        });

        it("should declare a claim successfully", async () => {
            const claimAmount = web3.utils.toWei('5', 'ether');
            const ipfsHash = "QmTest123456789";

            const result = await instance.declareClaim(1, claimAmount, ipfsHash, { from: user1 });

            assert.equal(result.logs[0].event, 'ClaimDeclared');
            assert.equal(result.logs[0].args.claimId.toNumber(), 1);
            assert.equal(result.logs[0].args.policyId.toNumber(), 1);
            assert.equal(result.logs[0].args.amount.toString(), claimAmount);
            assert.equal(result.logs[0].args.ipfsHash, ipfsHash);
        });

        it("should store claim data correctly", async () => {
            const claimAmount = web3.utils.toWei('5', 'ether');
            const ipfsHash = "QmTest123456789";

            await instance.declareClaim(1, claimAmount, ipfsHash, { from: user1 });

            const claim = await instance.getClaim(1);
            assert.equal(claim.policyId.toNumber(), 1);
            assert.equal(claim.claimant, user1);
            assert.equal(claim.amountClaimed.toString(), claimAmount);
            assert.equal(claim.ipfsHash, ipfsHash);
            assert.equal(claim.isValidated, false);
            assert.equal(claim.isPaid, false);
        });

        it("should revert if claim amount exceeds coverage", async () => {
            const excessiveAmount = web3.utils.toWei('15', 'ether');
            try {
                await instance.declareClaim(1, excessiveAmount, "QmTest", { from: user1 });
                assert.fail("Should have reverted");
            } catch (error) {
                assert(error.message.includes("Montant superieur a la couverture"));
            }
        });

        it("should revert if caller is not the insured", async () => {
            try {
                await instance.declareClaim(1, web3.utils.toWei('5', 'ether'), "QmTest", { from: user2 });
                assert.fail("Should have reverted");
            } catch (error) {
                assert(error.message.includes("Non autorise"));
            }
        });
    });

    describe("Claim Validation and Indemnity", () => {
        beforeEach(async () => {
            await instance.createPolicy(coverageAmount, premium, duration, { from: user1, value: premium });
            await instance.declareClaim(1, web3.utils.toWei('5', 'ether'), "QmTest", { from: user1 });
        });

        it("should validate claim and pay indemnity", async () => {
            const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(user1));

            const result = await instance.validateClaim(1, true, { from: owner });

            // Vérifier l'événement ClaimValidated
            const validatedEvent = result.logs.find(log => log.event === 'ClaimValidated');
            assert(validatedEvent, "ClaimValidated event should be emitted");
            assert.equal(validatedEvent.args.claimId.toNumber(), 1);
            assert.equal(validatedEvent.args.approved, true);

            // Vérifier l'événement IndemnityPaid
            const paidEvent = result.logs.find(log => log.event === 'IndemnityPaid');
            assert(paidEvent, "IndemnityPaid event should be emitted");

            // Vérifier que le statut du claim est mis à jour
            const claim = await instance.getClaim(1);
            assert.equal(claim.isValidated, true);
            assert.equal(claim.isPaid, true);
        });

        it("should reject claim without payment", async () => {
            const result = await instance.validateClaim(1, false, { from: owner });

            const validatedEvent = result.logs.find(log => log.event === 'ClaimValidated');
            assert(validatedEvent);
            assert.equal(validatedEvent.args.approved, false);

            // Vérifier qu'il n'y a PAS d'événement IndemnityPaid
            const paidEvent = result.logs.find(log => log.event === 'IndemnityPaid');
            assert(!paidEvent, "IndemnityPaid should not be emitted");

            const claim = await instance.getClaim(1);
            assert.equal(claim.isValidated, true);
            assert.equal(claim.isPaid, false);
        });

        it("should only allow owner to validate claims", async () => {
            try {
                await instance.validateClaim(1, true, { from: user2 });
                assert.fail("Should have reverted");
            } catch (error) {
                assert(error.message.includes("Non autorise"));
            }
        });

        it("should not allow validating the same claim twice", async () => {
            await instance.validateClaim(1, true, { from: owner });

            try {
                await instance.validateClaim(1, true, { from: owner });
                assert.fail("Should have reverted");
            } catch (error) {
                assert(error.message.includes("Sinistre deja traite"));
            }
        });
    });

    describe("View Functions", () => {
        it("should return correct contract balance", async () => {
            await instance.createPolicy(coverageAmount, premium, duration, { from: user1, value: premium });

            const contractBalance = await instance.getContractBalance();
            assert.equal(contractBalance.toString(), premium);
        });
    });
});

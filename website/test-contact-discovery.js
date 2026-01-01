// Quick test script for contact discovery
// Run with: node test-contact-discovery.js

const testCompany = process.argv[2] || 'Google';
const testRole = process.argv[3] || 'Software Engineer';

async function testContactDiscovery() {
  console.log(`\n🔍 Testing contact discovery for:`);
  console.log(`   Company: ${testCompany}`);
  console.log(`   Role: ${testRole}\n`);

  try {
    const response = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company: testCompany,
        role: testRole,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error:', errorData.error);
      return;
    }

    const data = await response.json();

    console.log('✅ Search completed!\n');
    console.log('📊 Results Summary:');
    console.log(`   Company: ${data.company?.name || 'N/A'}`);
    console.log(`   Domain: ${data.company?.domain || 'N/A'}`);
    console.log(`   Recruiters found: ${data.recruiters?.length || 0}`);
    console.log(`   Domain employees found: ${data.domainEmployees?.length || 0}`);
    console.log(`   Jobs found: ${data.jobs?.length || 0}`);
    console.log(`   Total contacts: ${data.totalContacts || 0}\n`);

    if (data.recruiters && data.recruiters.length > 0) {
      console.log('👥 Recruiters:');
      data.recruiters.slice(0, 5).forEach((contact, i) => {
        console.log(`   ${i + 1}. ${contact.full_name} - ${contact.title}`);
        console.log(`      Email: ${contact.email} (${contact.email_status})`);
        console.log(`      Source: ${contact.source}`);
      });
      if (data.recruiters.length > 5) {
        console.log(`   ... and ${data.recruiters.length - 5} more`);
      }
      console.log('');
    }

    if (data.domainEmployees && data.domainEmployees.length > 0) {
      console.log('💼 Domain Employees:');
      data.domainEmployees.slice(0, 5).forEach((contact, i) => {
        console.log(`   ${i + 1}. ${contact.full_name} - ${contact.title}`);
        console.log(`      Email: ${contact.email} (${contact.email_status})`);
        console.log(`      Source: ${contact.source}`);
      });
      if (data.domainEmployees.length > 5) {
        console.log(`   ... and ${data.domainEmployees.length - 5} more`);
      }
      console.log('');
    }

    // Check if we got multiple contacts
    const totalContacts = (data.recruiters?.length || 0) + (data.domainEmployees?.length || 0);
    if (totalContacts > 1) {
      console.log('✅ SUCCESS: Multiple contacts returned!');
    } else if (totalContacts === 1) {
      console.log('⚠️  WARNING: Only 1 contact returned');
    } else {
      console.log('❌ ERROR: No contacts returned');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testContactDiscovery();

